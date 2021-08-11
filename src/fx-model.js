import { DepGraph } from './dep_graph.js';
import { Fore } from './fore.js';
import './fx-instance.js';
import { ModelItem } from './modelitem.js';
import { evaluateXPath, evaluateXPathToBoolean } from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';

/**
 * @ts-check
 */
export class FxModel extends HTMLElement {
  constructor() {
    super();
    // this.id = '';

    this.instances = [];
    this.modelItems = [];
    this.defaultContext = {};

    // this.mainGraph = new DepGraph(false);
    this.inited = false;
    this.modelConstructed = false;
    this.attachShadow({ mode: 'open' });
  }

  get formElement() {
    return this.parentElement;
  }

  connectedCallback() {
    // console.log('connectedCallback ', this);
    this.shadowRoot.innerHTML = `
            <slot></slot>
        `;

    this.addEventListener('model-construct-done', e => {
      this.modelConstructed = true;
      // console.log('model-construct-done fired ', this.modelConstructed);
      console.log('model-construct-done fired ', e.detail.model.instances);
    });

    // logging
  }

  static lazyCreateModelItem(model, ref, node) {
    // console.log('lazyCreateModelItem ', node);

    let targetNode = {};
    if (node === null || node === undefined) return null;
    if (node.nodeType === node.TEXT_NODE) {
      // const parent = node.parentNode;
      // console.log('PARENT ', parent);
      targetNode = node.parentNode;
    } else {
      targetNode = node;
    }

    // const path = fx.evaluateXPath('path()',node);
    let path;
    if (node.nodeType) {
      path = XPathUtil.getPath(node);
    } else {
      path = null;
      targetNode = node;
    }
    // const path = XPathUtil.getPath(node);

    // ### intializing ModelItem with default values (as there is no <fx-bind> matching for given ref)
    const mi = new ModelItem(
      path,
      ref,
      Fore.READONLY_DEFAULT,
      Fore.RELEVANT_DEFAULT,
      Fore.REQUIRED_DEFAULT,
      Fore.CONSTRAINT_DEFAULT,
      Fore.TYPE_DEFAULT,
      targetNode,
      this,
    );

    // console.log('new ModelItem is instanceof ModelItem ', mi instanceof ModelItem);
    model.registerModelItem(mi);
    return mi;
  }

  modelConstruct() {
    console.log('### <<<<< dispatching model-construct >>>>>');
    this.dispatchEvent(new CustomEvent('model-construct', { detail: this }));

    const instances = this.querySelectorAll('fx-instance');
    if (instances.length > 0) {
      console.group('init instances');
      const promises = [];
      instances.forEach(instance => {
        promises.push(instance.init());
      });

      Promise.all(promises).then(() => {
        this.instances = Array.from(instances);
        console.log('_modelConstruct this.instances ', this.instances);
        this.updateModel();
        this.inited = true;

        console.log('### <<<<< dispatching model-construct-done >>>>>');
        this.dispatchEvent(
          new CustomEvent('model-construct-done', {
            composed: true,
            bubbles: true,
            detail: { model: this },
          }),
        );
      });
      console.groupEnd();
    } else {
      // ### if there's no instance one will created
      this.dispatchEvent(
        new CustomEvent('model-construct-done', {
          composed: true,
          bubbles: true,
          detail: { model: this },
        }),
      );
    }
    this.inited = true;
  }

  registerModelItem(modelItem) {
    // console.log('ModelItem registered ', modelItem);
    this.modelItems.push(modelItem);
  }

  /**
   * update action triggering the update cycle
   */
  updateModel() {
    this.rebuild();
    this.recalculate();
    this.revalidate();
  }

  rebuild() {
    console.group('### rebuild');

    this.mainGraph = new DepGraph(false);
    this.modelItems = [];

    // trigger recursive initialization of the fx-bind elements
    const binds = this.querySelectorAll('fx-model > fx-bind');
    binds.forEach(bind => {
      bind.init(this);
    });

    // console.log(`dependencies of a `, this.mainGraph.dependenciesOf("/Q{}data[1]/Q{}a[1]:required"));
    // console.log(`dependencies of b `, this.mainGraph.dependenciesOf("/Q{}data[1]/Q{}b[1]:required"));
    console.log(`rebuild mainGraph`, this.mainGraph);
    console.log(`rebuild mainGraph calc order`, this.mainGraph.overallOrder());
    /*
    console.log(
      `rebuild finished with modelItems ${this.modelItems.length} item(s)`,
      this.modelItems,
    );
*/
    console.groupEnd();
  }

  /**
   * recalculation of all modelItems. Uses dependency graph to determine order of computation.
   *
   * todo: use 'changed' flag on modelItems to determine subgraph for recalculation. Flag already exists but is not used.
   */
  recalculate() {
    console.group('### recalculate');
    console.log('recalculate instances ', this.instances);

    const v = this.mainGraph.overallOrder();
    v.forEach(path => {
      console.log('recalculating path ', path);

      const node = this.mainGraph.getNodeData(path);
      // console.log('recalculating node ', node);
      const modelItem = this.getModelItem(node);
      // console.log('modelitem ', modelItem);

      if (modelItem && path.includes(':')) {
        const property = path.split(':')[1];
        if (property) {
          if (property === 'calculate') {
            const expr = modelItem.bind[property];
            const compute = evaluateXPath(expr, modelItem.node, this);
            modelItem.value = compute;
          } else if (property !== 'constraint' && property !== 'type') {
            console.log('recalculating property ', property);

            const expr = modelItem.bind[property];
            if (expr) {
              console.log('recalc expr: ', expr);
              const compute = evaluateXPathToBoolean(expr, modelItem.node, this);
              modelItem[property] = compute;
              console.log(`modelItem computed`, modelItem.required);
            }
          }
        }
      }
    });
    console.log(
      `recalculate finished with modelItems ${this.modelItems.length} item(s)`,
      this.modelItems,
    );
    console.groupEnd();
  }

  /**
   * Iterates all modelItems to calculate the validation status.
   *
   * Model alerts are given on 'fx-bind' elements as either attribute `alert` or as `fx-alert` child elements.
   *
   * During model-construct all model alerts are added to the modelItem if any
   *
   * to revalidate:
   * Gets the `constraint` attribute declaration from modelItem.bind
   * Computes the XPath to a Boolean
   * Updates the modelItem.constraint property
   *
   * todo: type checking
   * todo: run browser validation API
   *
   */
  revalidate() {
    console.group('### revalidate');

    let valid = true;
    this.modelItems.forEach(modelItem => {
      // console.log('validating node ', modelItem.node);

      const { bind } = modelItem;
      if (bind) {
        /*
        todo: investigate why bind is an element when created in fx-bind.init() and an fx-bind object when
          created lazily.
        */
        if (typeof bind.hasAttribute === 'function' && bind.hasAttribute('constraint')) {
          const constraint = bind.getAttribute('constraint');
          if (constraint) {
            const compute = evaluateXPathToBoolean(constraint, modelItem.node, this);
            console.log('modelItem validity computed: ', compute);
            modelItem.constraint = compute;
            if (!compute) valid = false;
            // ### alerts are added only once during model-construct. Otherwise they would add up in each run of revalidate()
            if (!this.modelConstructed) {
              // todo: get alert from attribute or child element
              const alert = bind.getAlert();
              if (alert) {
                modelItem.addAlert(alert);
              }
            }
          }
        }
      }
    });
    console.log('modelItems after revalidate: ', this.modelItems);
    console.groupEnd();
    return valid;
  }

  /**
   *
   * @param node
   * @returns {ModelItem}
   */
  getModelItem(node) {
    return this.modelItems.find(m => m.node === node);
  }

  /**
   * get the default evaluation context for this model.
   * @returns {Element} the
   */
  getDefaultContext() {
    return this.instances[0].getDefaultContext();
  }

  getDefaultInstance() {
    return this.instances[0];
  }

  getDefaultInstanceData() {
    console.log('default instance data ', this.instances[0].instanceData);
    return this.instances[0].instanceData;
  }

  getInstance(id) {
    // console.log('getInstance ', id);
    // console.log('instances ', this.instances);
    // console.log('instances array ',Array.from(this.instances));

    const instArray = Array.from(this.instances);
    return instArray.find(inst => inst.id === id);
  }

  evalBinding(bindingExpr) {
    // console.log('MODEL.evalBinding ', bindingExpr);
    // default context of evaluation is always the default instance
    const result = this.instances[0].evalXPath(bindingExpr);
    return result;
  }
}

customElements.define('fx-model', FxModel);
