import React from 'react';
import ListViewer from './ListViewer';
import instances from './instances-small.json';


const conf = undefined;


export default class ListViewerShowcase extends React.Component {
   
  selectAction (param) {
    console.log(param);
    alert("select " + param);
  }
  render () {
    
    return <ListViewer columnConfiguration={conf} filter={() => true} instances={instances} handler={this}/>
  }
}