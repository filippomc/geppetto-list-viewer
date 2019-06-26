import React from 'react';
import Griddle, { plugins, ColumnDefinition, RowDefinition } from 'griddle-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee, faGhost, faChartArea, faHandPointer } from '@fortawesome/free-solid-svg-icons'


export const GroupComponent = conf => ({ value }) => conf.map(
  ({ id, customComponent, configuration }) =>
    React.createElement(customComponent(configuration), { key: id, value: value })
);
export const IconComponent = ({ icon, action }) => ({ value }) => <FontAwesomeIcon icon={icon} onClick={() => action(value)} />

const WrapperComponent = (cssClassName, action, customComponent) => ({ value }) => (<span className={cssClassName}>{customComponent ? React.createElement(customComponent, { value: value }) : value}</span>)

export const defaultColumnConfiguration = [
  {
    id: "path",
    displayName: "Path",
    source: entity => entity.path, // Can be specified also as the string "path"
    cssClassName: 'red', 
  },
  {
    id: "controls",
    source: entity => entity,
    displayName: "Controls",
    customComponent: GroupComponent,
    
    configuration: [
      {
        id: "plot",
        customComponent: IconComponent,
        configuration: {
          action: entity => alert('plot'),
          icon: faChartArea,
          label: "Plot",
          tooltip: "Plot time series"
        },

      },
      {
        id: "select",
        customComponent: IconComponent,
        configuration: {
          action: 'selectAction', // This will call the method on the handler component specified
          icon: faHandPointer,
          label: "Select",
          tooltip: "Select in 3D canvas"
        },

      },
    ]
  },
  {
    id: "long",
    customComponent: IconComponent,
    source: entity => entity.path,
    configuration: {
      action: 'selectAction', // This will call the method on the handler component specified
      icon: faGhost,
      label: "Ghost",
      tooltip: "Ghost tooltip"
    },

  },
  {
    id: "pathHidden",
    displayName: "Path",
    visible: false,
    source: entity => entity.path // Can be specified also as the string "path"
  }
];


function extractGriddleData (data, listViewerColumnsConfiguration) {
  return data.map(row => listViewerColumnsConfiguration.reduce(
    (processedRow, confItem) => {
      processedRow[confItem.id] = confItem.source(row);
      return processedRow;
    }, {})
  );
}


const CustomHeading = ({ title }) => <span style={{ color: '#AA0000' }}>{title}</span>;


export default class ListViewer extends React.Component {

  constructor (props, context) {
    super(props, context);
    this.preprocessColumnConfiguration = this.preprocessColumnConfiguration.bind(this);
    this.handlerObject = this.props.handler;
    this.init();
  }

  componentDidUpdate () {
    this.init();
  }


  init () {
    this.columnConfiguration = this.preprocessColumnConfiguration(
      this.props.columnConfiguration !== undefined
        ? this.props.columnConfiguration
        : defaultColumnConfiguration
    );
    this.data = extractGriddleData(this.props.instances, this.columnConfiguration);
  }

  /**
   * Parses the configuration for further processing, inserting defaults and adjusting types
   * @param {id, action, customComponent, configuration} colConf 
   */
  preprocessColumnConfiguration (conf) {
    if (this.incrementalId === undefined) {
      this.incrementalId = 0;
    }
    if (conf instanceof Array) {
      return conf.map(this.preprocessColumnConfiguration)
    }

    if (conf.configuration && !conf.customComponent) {
      console.warn("Configuration was specified for column", conf.id, "but no customComponent was specified.");
    }

    return {
      ...conf,
      id: conf.id ? conf.id : this.incrementalId++,
      action: conf.action === undefined ? undefined : this.preprocessAction(conf.action),
      customComponent: conf.customComponent === undefined ? undefined : this.preprocessComponent(conf.customComponent),
      configuration: conf.configuration === undefined ? undefined : this.preprocessColumnConfiguration(conf.configuration)
    };

  }
  preprocessAction (action) {
    return typeof action === 'string' || action instanceof String ? entity => this.handlerObject[action](entity) : action;
  }

  preprocessComponent (customComponent) {
    return customComponent instanceof String ? eval(customComponent) : customComponent;
  }

  getFilterFn () {
    return this.props.filterFn ? this.props.filterFn : () => true;
  }

  render () {
    // const { data, currentPage, pageSize, recordCount } = this.state;
    console.log("ColumnConfiguration", this.columnConfiguration);
    window.conf = this.columnConfiguration;
    return <div className='listViewer'>

      <Griddle

        data={this.data}

        plugins={[plugins.LocalPlugin, plugins.PositionPlugin({
          tableHeight: 200,
          tableWidth: null,
          fixedHeader: true
        })]}


        /*
         * pageProperties={{
         *     currentPage: currentPage,
         *     pageSize: pageSize,
         *     recordCount: recordCount,
         * }} 
         */
      >
        <RowDefinition>
          {
            this.getColumnDefinitions()
          }
        </RowDefinition>
      </Griddle>

    </div>
  }
  
  /**
   * <ColumnDefinition key="path" id="path" customComponent={CustomColumn} />,
   * <ColumnDefinition key="controls" id="actions" customHeadingComponent={CustomHeading} customComponent={CustomActions(buttonsConf)} />
   * @param {*} param0 
   */
  getColumnDefinition ({ id, customComponent, configuration, cssClassName, displayName, action, visible }) {
    if (configuration && customComponent) {
      customComponent = customComponent(configuration)
    }
    if ( action) {
      customComponent = WrapperComponent(cssClassName, action, customComponent)
    }
     
    return <ColumnDefinition key={id} id={id} title={displayName} cssClassName={cssClassName} visible={visible} customHeadingComponent={CustomHeading} customComponent={customComponent} />
  }

  getColumnDefinitions () {
    return this.columnConfiguration.map(colConf => this.getColumnDefinition(colConf));
  }
}