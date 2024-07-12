/**
 * A simple dependency graph
 *
 * based on the work of https://github.com/jriecken/dependency-graph but working on ES6.
 *
 * Furthermore instead of the DepGraphCycleError a compute-exception event is dispatched.
 *
 *
 */

/**
 * Cycle error, including the path of the cycle.
 */
// const DepGraphCycleError = (exports.DepGraphCycleError = function (cyclePath) {

/*
export function DepGraphCycleError(cyclePath) {
  const message = "Dependency Cycle Found: " + cyclePath.join(" -> ");
  const instance = new Error(message);
  instance.cyclePath = cyclePath;
  Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
  if (Error.captureStackTrace) {
    Error.captureStackTrace(instance, DepGraphCycleError);
  }
  return instance;
};

DepGraphCycleError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: Error,
    enumerable: false,
    writable: true,
    configurable: true
  }
});
Object.setPrototypeOf(DepGraphCycleError, Error);
*/

/**
 * Helper for creating a Topological Sort using Depth-First-Search on a set of edges.
 *
 * Detects cycles and throws an Error if one is detected (unless the "circular"
 * parameter is "true" in which case it ignores them).
 *
 * @param edges The set of edges to DFS through
 * @param leavesOnly Whether to only return "leaf" nodes (ones who have no edges)
 * @param result An array in which the results will be populated
 * @param circular A boolean to allow circular dependencies
 */
function createDFS(edges, leavesOnly, result, circular) {
  const visited = {};
  // eslint-disable-next-line func-names
  return function (start) {
    // console.log('start ', start);
    if (visited[start]) {
      return;
    }
    const inCurrentPath = {};
    const currentPath = [];
    const todo = []; // used as a stack
    todo.push({ node: start, processed: false });
    while (todo.length > 0) {
      const current = todo[todo.length - 1]; // peek at the todo stack
      const { processed } = current;
      const { node } = current;
      if (!processed) {
        // Haven't visited edges yet (visiting phase)
        if (visited[node]) {
          todo.pop();
          // eslint-disable-next-line no-continue
          continue;
        } else if (inCurrentPath[node]) {
          // It's not a DAG
          if (circular) {
            todo.pop();
            // If we're tolerating cycles, don't revisit the node
            // eslint-disable-next-line no-continue
            continue;
          }
          currentPath.push(node);
          window.dispatchEvent(
            new CustomEvent('compute-exception', {
              composed: false,
              bubbles: true,
              detail: {
                path: currentPath,
                message: 'cyclic graph',
              },
            }),
          );
          // return;
          // console.log('‘circular path: ' + currentPath);
          // throw new DepGraphCycleError(currentPath);

          // Stop all processing. This form is broken and we should not break the browser
          throw new Error(`Cyclic at ${currentPath}`);
        }

        inCurrentPath[node] = true;
        currentPath.push(node);
        const nodeEdges = edges[node];
        // (push edges onto the todo stack in reverse order to be order-compatible with the old DFS implementation)
        for (let i = nodeEdges.length - 1; i >= 0; i -= 1) {
          todo.push({ node: nodeEdges[i], processed: false });
        }
        current.processed = true;
      } else {
        // Have visited edges (stack unrolling phase)
        todo.pop();
        currentPath.pop();
        inCurrentPath[node] = false;
        visited[node] = true;
        if (!leavesOnly || edges[node].length === 0) {
          result.push(node);
        }
      }
    }
  };
}

/**
 * Simple Dependency Graph
 */

/*
var DepGraph = (exports.DepGraph = function DepGraph(opts) {
  this.nodes = {}; // Node -> Node/Data (treated like a Set)
  this.outgoingEdges = {}; // Node -> [Dependency Node]
  this.incomingEdges = {}; // Node -> [Dependant Node]
  this.circular = opts && !!opts.circular; // Allows circular deps
});
*/

export function DepGraph(opts) {
  this.nodes = {}; // Node -> Node/Data (treated like a Set)
  this.outgoingEdges = {}; // Node -> [Dependency Node]
  this.incomingEdges = {}; // Node -> [Dependant Node]
  this.circular = opts && !!opts.circular; // Allows circular deps
}

DepGraph.prototype = {
  /**
   * The number of nodes in the graph.
   */
  size() {
    return Object.keys(this.nodes).length;
  },
  /**
   * Add a node to the dependency graph. If a node already exists, this method will do nothing.
   */
  addNode(node, data) {
    if (!this.hasNode(node)) {
      // Checking the arguments length allows the user to add a node with undefined data
      if (arguments.length === 2) {
        this.nodes[node] = data;
      } else {
        this.nodes[node] = node;
      }
      this.outgoingEdges[node] = [];
      this.incomingEdges[node] = [];
    }
  },
  /**
   * Remove a node from the dependency graph. If a node does not exist, this method will do nothing.
   */
  removeNode(node) {
    if (this.hasNode(node)) {
      delete this.nodes[node];
      delete this.outgoingEdges[node];
      delete this.incomingEdges[node];
      // [this.incomingEdges, this.outgoingEdges].forEach(function (edgeList) {
      [this.incomingEdges, this.outgoingEdges].forEach(edgeList => {
        Object.keys(edgeList).forEach(key => {
          const idx = edgeList[key].indexOf(node);
          if (idx >= 0) {
            edgeList[key].splice(idx, 1);
          }
        }, this);
      });
    }
  },
  /**
   * Check if a node exists in the graph
   */
  hasNode(node) {
    // return this.nodes.hasOwnProperty(node);

    return Object.prototype.hasOwnProperty.call(this.nodes, node);
  },
  /**
   * Get the data associated with a node name
   */
  getNodeData(node) {
    if (this.hasNode(node)) {
      return this.nodes[node];
    }
    throw new Error(`Node does not exist: ${node}`);
  },
  /**
   * Set the associated data for a given node name. If the node does not exist, this method will throw an error
   */
  setNodeData(node, data) {
    if (this.hasNode(node)) {
      this.nodes[node] = data;
    } else {
      throw new Error(`Node does not exist: ${node}`);
    }
  },
  /**
   * Add a dependency between two nodes. If either of the nodes does not exist,
   * an Error will be thrown.
   */
  addDependency(from, to) {
    if (!this.hasNode(from)) {
      throw new Error(`Node does not exist: ${from}`);
    }
    if (!this.hasNode(to)) {
      throw new Error(`Node does not exist: ${to}`);
    }
    if (this.outgoingEdges[from].indexOf(to) === -1) {
      this.outgoingEdges[from].push(to);
    }
    if (this.incomingEdges[to].indexOf(from) === -1) {
      this.incomingEdges[to].push(from);
    }
    return true;
  },
  /**
   * Remove a dependency between two nodes.
   */
  removeDependency(from, to) {
    let idx;
    if (this.hasNode(from)) {
      idx = this.outgoingEdges[from].indexOf(to);
      if (idx >= 0) {
        this.outgoingEdges[from].splice(idx, 1);
      }
    }

    if (this.hasNode(to)) {
      idx = this.incomingEdges[to].indexOf(from);
      if (idx >= 0) {
        this.incomingEdges[to].splice(idx, 1);
      }
    }
  },
  /**
   * Return a clone of the dependency graph. If any custom data is attached
   * to the nodes, it will only be shallow copied.
   */
  clone() {
    const source = this;
    const result = new DepGraph();
    const keys = Object.keys(source.nodes);
    keys.forEach(n => {
      result.nodes[n] = source.nodes[n];
      result.outgoingEdges[n] = source.outgoingEdges[n].slice(0);
      result.incomingEdges[n] = source.incomingEdges[n].slice(0);
    });
    return result;
  },
  /**
   * Get an array containing the direct dependencies of the specified node.
   *
   * Throws an Error if the specified node does not exist.
   */
  directDependenciesOf(node) {
    if (this.hasNode(node)) {
      return this.outgoingEdges[node].slice(0);
    }
    throw new Error(`Node does not exist: ${node}`);
  },
  /**
   * Get an array containing the nodes that directly depend on the specified node.
   *
   * Throws an Error if the specified node does not exist.
   */
  directDependantsOf(node) {
    if (this.hasNode(node)) {
      return this.incomingEdges[node].slice(0);
    }
    throw new Error(`Node does not exist: ${node}`);
  },
  /**
   * Get an array containing the nodes that the specified node depends on (transitively).
   *
   * Throws an Error if the graph has a cycle, or the specified node does not exist.
   *
   * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned
   * in the array.
   */
  dependenciesOf(node, leavesOnly) {
    if (this.hasNode(node)) {
      const result = [];
      const DFS = createDFS(this.outgoingEdges, leavesOnly, result, this.circular);
      DFS(node);
      const idx = result.indexOf(node);
      if (idx >= 0) {
        result.splice(idx, 1);
      }
      return result;
    }
    throw new Error(`Node does not exist: ${node}`);
  },
  /**
   * get an array containing the nodes that depend on the specified node (transitively).
   *
   * Throws an Error if the graph has a cycle, or the specified node does not exist.
   *
   * If `leavesOnly` is true, only nodes that do not have any dependants will be returned in the array.
   */
  dependantsOf(node, leavesOnly) {
    if (this.hasNode(node)) {
      const result = [];
      const DFS = createDFS(this.incomingEdges, leavesOnly, result, this.circular);
      DFS(node);
      const idx = result.indexOf(node);
      if (idx >= 0) {
        result.splice(idx, 1);
      }
      return result;
    }
    throw new Error(`Node does not exist: ${node}`);
  },

  /**
   * Get an array of nodes that have no dependants (i.e. nothing depends on them).
   */
  entryNodes() {
    const self = this;
    return Object.keys(this.nodes).filter(node => self.incomingEdges[node].length === 0);
  },

  /**
   * Construct the overall processing order for the dependency graph.
   *
   * Throws an Error if the graph has a cycle.
   *
   * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned.
   */
  overallOrder(leavesOnly) {
    const self = this;
    const result = [];
    const keys = Object.keys(this.nodes);
    if (keys.length === 0) {
      return result; // Empty graph
    }
    if (!this.circular) {
      // Look for cycles - we run the DFS starting at all the nodes in case there
      // are several disconnected subgraphs inside this dependency graph.
      const CycleDFS = createDFS(this.outgoingEdges, false, [], this.circular);
      keys.forEach(n => {
        CycleDFS(n);
      });
    }

    const DFS = createDFS(this.outgoingEdges, leavesOnly, result, this.circular);
    // Find all potential starting points (nodes with nothing depending on them) an
    // run a DFS starting at these points to get the order
    keys
      .filter(node => self.incomingEdges[node].length === 0)
      .forEach(n => {
        DFS(n);
      });

    // If we're allowing cycles - we need to run the DFS against any remaining
    // nodes that did not end up in the initial result (as they are part of a
    // subgraph that does not have a clear starting point)
    if (this.circular) {
      keys.filter(node => result.indexOf(node) === -1).forEach(n => DFS(n));
    }

    return result;
  },
};

// Create some aliases
DepGraph.prototype.directDependentsOf = DepGraph.prototype.directDependantsOf;
DepGraph.prototype.dependentsOf = DepGraph.prototype.dependantsOf;
