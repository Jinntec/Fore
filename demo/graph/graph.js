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
function renderGraph(graph, targetElement) {
  // const graph = e.detail.graph;
  const nodesData = [];
  const edgeData = [];
  const dataSet = new vis.DataSet([]);
  console.log('graph', graph.entryNodes());
  const entryNodes = graph.nodes;

  // build the nodes data
  Object.keys(entryNodes).filter((node) => {
    console.log('node', node);
    if (!node.includes(':')) {
      // nodesData.push({id: node, label: node, shape:'circle',size:250,group:node});
      const realNode = graph.getNodeData(node);
      nodesData.push({
        id: node,
        label: `${realNode.textContent}\n${node}`,
        shape: 'circle',
        size: 250,
        group: 'node',
        shadow: false,
        selectable: false,
      });
    } else {
      const prop = node.substring(node.indexOf(':') + 1, node.length);
      nodesData.push({
        id: node, label: prop, shape: 'diamond', group: prop,
      });
    }
  });

  // console.log('nodeData', nodesData);

  // build the edge data
  const ordered = graph.overallOrder(false);
  // console.log('ordered', ordered);

  let index = 0;
  // console.log('outgoingEdges', graph.outgoingEdges);
  ordered.forEach((node) => {
    // console.log('item', node);
    // console.log('deps', graph.outgoingEdges[node]);
    if (node.includes(':')) {
      index += 1;
      const deps = graph.outgoingEdges[node];
      const from = node.substring(0, node.indexOf(':'));
      const prop = node.substring(node.indexOf(':') + 1, node.length);

      if (node !== from) {
        edgeData.push({
          from,
          to: node,
          label: `${index}`,
          // relation:prop,
          font: { background: 'white', opacity: 0.5 },
          shadow: true,
        });
      }

      deps.forEach((dep) => {
        // console.log('dep', dep);
        const noderef = node.substring(0, node.indexOf(':'));
        if (noderef !== dep) {
          edgeData.push({
            from: node,
            to: dep,
            label: `${index}`,
            relation: prop,
            font: { background: 'white', opacity: 0.5 },
          });
        }
      });
    }
    /*
        else {
            const deps = graph.outgoingEdges[node];
            if (deps.length !== 0) {
                deps.forEach(dep => {
                    // console.log('dep', dep);
                    edgeData.push({
                        from: node,
                        to: dep,
                        label: index + '',
                        relation: dep,
                        font: {background: "white", opacity: 0.5},
                    });
                });
            }
        }
*/
  });

  const outgoing = graph.outgoingEdges;
  // console.log('overallOrder', graph.overallOrder(false));
  // console.log('edgeData', edgeData);

  const container = document.getElementById(targetElement);
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
  const network = new vis.Network(container, data, options);
}
