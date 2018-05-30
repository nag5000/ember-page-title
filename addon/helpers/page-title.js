import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { merge } from '@ember/polyfills';
import { getOwner } from '@ember/application';

let _initialTitleRemoved = false;

/**
  `{{page-title}}` is used to communicate with

  @public
  @method page-title
 */
export default Helper.extend({
  pageTitleList: service(),
  headData: service(),

  init() {
    this._super();
    let tokens = get(this, 'pageTitleList');
    tokens.push({ id: guidFor(this) });
  },

  compute(params, _hash) {
    let tokens = get(this, 'pageTitleList');
    let hash = merge({}, _hash);
    hash.id = guidFor(this);
    hash.title = params.join('');
    tokens.push(hash);
    scheduleOnce('afterRender', this, this.updateTitle, tokens);
    return '';
  },

  destroy() {
    let tokens = get(this, 'pageTitleList');
    let id = guidFor(this);
    tokens.remove(id);

    let router = getOwner(this).lookup('router:main');
    let routes = router._routerMicrolib || router.router;
    let { activeTransition } = routes || {};
    if (activeTransition) {
      activeTransition.promise.finally(() => {
        if (this.get('headData.isDestroyed')) { return; }
        scheduleOnce('afterRender', this, this.updateTitle, tokens);
      });
    } else {
      scheduleOnce('afterRender', this, this.updateTitle, tokens);
    }
  },

  updateTitle(tokens) {
    if (!_initialTitleRemoved) {
      _initialTitleRemoved = true;
      this.removeExistingTitleTag();
    }

    this.set('headData.title', tokens.toString());
  },

  removeExistingTitleTag() {
    let title = document.head.querySelector('title');
    if (title) {
      document.head.removeChild(title);
    }
  }
});
