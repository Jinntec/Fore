function legend(nodesData, targetElement) {
  const x = -targetElement.clientWidth / 2 + 50;
  const y = -targetElement.clientHeight / 2 + 50;
  const step = 70;

  nodesData.push({
    id: 1000,
    x,
    y,
    label: 'calculate',
    group: 'calculate',
    value: 1,
    fixed: true,
    physics: false,
  });
  nodesData.push({
    id: 1001,
    x,
    y: y + step,
    label: 'readonly',
    group: 'readonly',
    value: 1,
    fixed: true,
    physics: false,
  });
  nodesData.push({
    id: 1002,
    x: 0,
    y: y + 2 * step,
    label: 'required',
    group: 'required',
    value: 1,
    fixed: true,
    physics: false,
  });
  nodesData.push({
    id: 1003,
    x: 0,
    y: y + 3 * step,
    label: 'relevant',
    group: 'relevant',
    value: 1,
    fixed: true,
    physics: false,
  });
}
function renderGraph(foreNodes, targetElement) {
  // const graph = e.detail.graph;
  const nodesData = [];
  const edgeData = [];
  const dataSet = new vis.DataSet([]);
  // console.log('graph', graph.entryNodes());
  const entryNodes = foreNodes;

  // build the nodes data
  Object.keys(entryNodes).filter((node) => {
    console.log('node', node);
    nodesData.push({
      id: node,
      label: `${node.textContent}\n${node}`,
      shape: 'circle',
      size: 250,
      group: 'node',
      shadow: false,
      selectable: false,
    });
  });

  const data = {
    nodes: nodesData,
    edges: edgeData,
  };
  const options = {
    interaction: {
      zoomSpeed: 0.3,
    },
    nodes: {
      margin: {
        top: 10, left: 10, bottom: 10, right: 10,
      },
      font: {
        size: 22,
      },
      shadow: true,
      widthConstraint: {
        maximum: 400,
      },
    },
    layout: {
      improvedLayout: true,
      clusterThreshold: 150,
      hierarchical: {
        sortMethod: 'directed',
        shakeTowards: 'roots',
        treeSpacing: 150,
        nodeSpacing: 150,
        levelSeparation: 150,
        edgeMinimization: true,
        blockShifting: false,
        direction: 'UD',
        parentCentralization: true,
      },
    },
    edges: {
      smooth: true,
      arrows: { to: true },
      length: 150,
    },
    interaction: {
      zoomView: false,
    },
    physics: {
      enabled: false,
    },
    groups: {
      node: {
        shape: 'circle',
        color: 'orange',
      },
      calculate: {
        shape: 'box',
        color: '#2B7CE9',
      },
      readonly: {
        shape: 'box',
        color: 'silver',
      },
      required: {
        shape: 'box',
        color: 'red',
      },
      relevant: {
        shape: 'box',
        color: 'green',
      },
    },
  };
  const container = document.getElementById(targetElement);
  const network = new vis.Network(container, data, options);
}
