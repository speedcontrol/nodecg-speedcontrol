(()=>{var t,e={9984:t=>{t.exports=function(t){t.options.__i18n=t.options.__i18n||[],t.options.__i18n.push('{"en":{"panelTitle":"Oengus Schedule Import","shortname":"Oengus Marathon Shortname","scheduleSlug":"Schedule Slug","helpText":"Insert the Oengus marathon shortname and schedule slug above and press the \\"Import Schedule Data\\" button. Keep in mind that it may take 5 minutes after saving for your schedule to update.","importInProgressHelpText":"Import currently in progress...","import":"Import Schedule Data","importProgress":"Importing {item}/{total}"},"ja":{"panelTitle":"Oengusからインポート","shortname":"Oengusマラソンの略称","helpText":"上記にインポートしたいOengusのイベントの略称を入力し(\\"/schedule\\"を含めないでください)、「スケジュール情報のインポート」ボタンを押してください。","importInProgressHelpText":"インポート処理の実行中...","import":"スケジュール情報のインポート","importProgress":"{item}/{total}件をインポート"}}'),delete t.options._Ctor}},2182:(t,e,n)=>{"use strict";var o,r=n(9340),i=n(2723),a=n(9804),s=n.n(a),c=n(3245),l=n(6819),u=(o=function(t,e){return o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])},o(t,e)},function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function n(){this.constructor=t}o(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),p=function(){return p=Object.assign||function(t){for(var e,n=1,o=arguments.length;n<o;n++)for(var r in e=arguments[n])Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);return t},p.apply(this,arguments)},f=function(t,e,n,o){var r,i=arguments.length,a=i<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,n,o);else for(var s=t.length-1;s>=0;s--)(r=t[s])&&(a=(i<3?r(a):i>3?r(e,n,a):r(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a},d={defaultSetupTime:nodecg.Replicant("defaultSetupTime"),horaroImportSavedOpts:nodecg.Replicant("horaroImportSavedOpts"),horaroImportStatus:nodecg.Replicant("horaroImportStatus"),oengusImportStatus:nodecg.Replicant("oengusImportStatus"),runDataActiveRun:nodecg.Replicant("runDataActiveRun"),runDataActiveRunSurrounding:nodecg.Replicant("runDataActiveRunSurrounding"),runDataArray:nodecg.Replicant("runDataArray"),runFinishTimes:nodecg.Replicant("runFinishTimes"),timer:nodecg.Replicant("timer"),timerChangesDisabled:nodecg.Replicant("timerChangesDisabled"),twitchAPIData:nodecg.Replicant("twitchAPIData"),twitchChannelInfo:nodecg.Replicant("twitchChannelInfo"),twitchCommercialTimer:nodecg.Replicant("twitchCommercialTimer")},h=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.reps={},e}return u(e,t),e.prototype.setState=function(t){var e=t.name,n=t.val;r.Ay.set(this.reps,e,s()(n))},e.prototype.setReplicant=function(t){var e=t.name,n=t.val,o=t.merge,i=void 0===o||o,a=this.reps[e],c=n;a&&i&&"object"==typeof a&&!Array.isArray(a)&&(c=p(p({},s()(a)),n)),r.Ay.set(this.reps,e,s()(c)),d[e].value=s()(c)},f([l.sM],e.prototype,"setState",null),f([l.sM],e.prototype,"setReplicant",null),f([(0,l.nV)({name:"ReplicantModule",namespaced:!0})],e)}(l.hw),m=(0,c.MF)("ReplicantModule"),g=n(714),y=n(8735),v=n(3427),b=n(6850),w=n(305);n(7980),n(8010),n(6577),n(8969),n(9493);var S=function(){var t=function(e,n){return t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])},t(e,n)};return function(e,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function o(){this.constructor=e}t(e,n),e.prototype=null===n?Object.create(n):(o.prototype=n.prototype,new o)}}(),O=function(t,e,n,o){var r,i=arguments.length,a=i<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,n,o);else for(var s=t.length-1;s>=0;s--)(r=t[s])&&(a=(i<3?r(a):i>3?r(e,n,a):r(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};const _=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.marathonShort=nodecg.bundleConfig.oengus.defaultMarathon||"",e.scheduleSlug=nodecg.bundleConfig.oengus.defaultSchedule||"",e}return S(e,t),e.prototype.importConfirm=function(){var t=this;new Promise((function(t){var e,n=nodecg.getDialog("alert-dialog"),o=null==n?void 0:n.querySelector("iframe");o&&n?(null===(e=o.contentWindow)||void 0===e?void 0:e.openDialog)?t():(o.addEventListener("load",(function(){n.close(),t()}),{once:!0}),n.open()):t()})).then((function(){var e=function(t){var e;try{var n=nodecg.getDialog(t),o=(null===(e=null==n?void 0:n.querySelector("iframe"))||void 0===e?void 0:e.contentWindow)||null;if(!o)throw new Error("Could not find the iFrame");return o}catch(e){nodecg.log.error('getDialog could not successfully find dialog "'.concat(t,'":'),e),window.alert("Attempted to open a NodeCG dialog but failed (if you are using a standalone version of a dashboard panel, this is not yet supported).")}return null}("alert-dialog");e&&e.openDialog({name:"ImportConfirm",func:t.import})}))},e.prototype.import=function(t){return e=this,n=void 0,r=function(){return function(t,e){var n,o,r,i,a={label:0,sent:function(){if(1&r[0])throw r[1];return r[1]},trys:[],ops:[]};return i={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function s(s){return function(c){return function(s){if(n)throw new TypeError("Generator is already executing.");for(;i&&(i=0,s[0]&&(a=0)),a;)try{if(n=1,o&&(r=2&s[0]?o.return:s[0]?o.throw||((r=o.return)&&r.call(o),0):o.next)&&!(r=r.call(o,s[1])).done)return r;switch(o=0,r&&(s=[2&s[0],r.value]),s[0]){case 0:case 1:r=s;break;case 4:return a.label++,{value:s[1],done:!1};case 5:a.label++,o=s[1],s=[0];continue;case 7:s=a.ops.pop(),a.trys.pop();continue;default:if(!((r=(r=a.trys).length>0&&r[r.length-1])||6!==s[0]&&2!==s[0])){a=0;continue}if(3===s[0]&&(!r||s[1]>r[0]&&s[1]<r[3])){a.label=s[1];break}if(6===s[0]&&a.label<r[1]){a.label=r[1],r=s;break}if(r&&a.label<r[2]){a.label=r[2],a.ops.push(s);break}r[2]&&a.ops.pop(),a.trys.pop();continue}s=e.call(t,a)}catch(t){s=[6,t],o=0}finally{n=r=0}if(5&s[0])throw s[1];return{value:s[0]?s[1]:void 0,done:!0}}([s,c])}}}(this,(function(e){switch(e.label){case 0:if(!t)return[3,4];e.label=1;case 1:return e.trys.push([1,3,,4]),[4,nodecg.sendMessage("importOengusSchedule",{marathonShort:this.marathonShort,slug:this.scheduleSlug})];case 2:case 3:return e.sent(),[3,4];case 4:return[2]}}))},new((o=Promise)||(o=Promise))((function(t,i){function a(t){try{c(r.next(t))}catch(t){i(t)}}function s(t){try{c(r.throw(t))}catch(t){i(t)}}function c(e){var n;e.done?t(e.value):(n=e.value,n instanceof o?n:new o((function(t){t(n)}))).then(a,s)}c((r=r.apply(e,n||[])).next())}));var e,n,o,r},e.prototype.mounted=function(){var t;(null===(t=window.frameElement)||void 0===t?void 0:t.parentElement)&&window.frameElement.parentElement.setAttribute("display-title",this.$t("panelTitle"))},O([m.State((function(t){return t.reps.oengusImportStatus}))],e.prototype,"importStatus",void 0),O([w.Ay],e)}(r.Ay);var A=n(7241),$=n(9984);const x=n.n($)();var P=(0,A.A)(_,(function(){var t=this,e=t._self._c;return t._self._setupProxy,e(y.A,[e("div",{staticClass:"d-flex"},[e(b.A,{staticClass:"d-flex-inline",attrs:{filled:"","hide-details":"",label:t.$t("shortname"),placeholder:"id",prefix:"/marathon/",disabled:t.importStatus.importing},model:{value:t.marathonShort,callback:function(e){t.marathonShort=e},expression:"marathonShort"}}),t._v(" "),e(b.A,{staticClass:"d-flex-inline",attrs:{filled:"","hide-details":"",prefix:"/schedule/",label:t.$t("scheduleSlug"),placeholder:"stream-1",disabled:t.importStatus.importing},model:{value:t.scheduleSlug,callback:function(e){t.scheduleSlug=e},expression:"scheduleSlug"}})],1),t._v(" "),e("div",{staticClass:"mt-2"},[t.importStatus.importing?[t._v("\n      "+t._s(t.$t("importInProgressHelpText"))+"\n    ")]:[e("div",[t._v("\n        "+t._s(t.$t("helpText"))+"\n      ")])]],2),t._v(" "),e("div",{staticClass:"mt-1"},[t.importStatus.importing?e(v.A,{attrs:{disabled:"",block:""}},[t._v("\n      "+t._s(t.$t("importProgress",{item:t.importStatus.item,total:t.importStatus.total}))+"\n    ")]):e(v.A,{attrs:{block:""},on:{click:t.importConfirm}},[t._v("\n      "+t._s(t.$t("import"))+"\n    ")])],1)])}),[],!1,null,null,null);"function"==typeof x&&x(P);const j=P.exports;var R=n(3578);r.Ay.use(R.Ay);const T=new R.il({strict:!1,state:{},modules:{ReplicantModule:h}});(function(t){return e=this,n=void 0,r=function(){return function(t,e){var n,o,r,i,a={label:0,sent:function(){if(1&r[0])throw r[1];return r[1]},trys:[],ops:[]};return i={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function s(s){return function(c){return function(s){if(n)throw new TypeError("Generator is already executing.");for(;i&&(i=0,s[0]&&(a=0)),a;)try{if(n=1,o&&(r=2&s[0]?o.return:s[0]?o.throw||((r=o.return)&&r.call(o),0):o.next)&&!(r=r.call(o,s[1])).done)return r;switch(o=0,r&&(s=[2&s[0],r.value]),s[0]){case 0:case 1:r=s;break;case 4:return a.label++,{value:s[1],done:!1};case 5:a.label++,o=s[1],s=[0];continue;case 7:s=a.ops.pop(),a.trys.pop();continue;default:if(!((r=(r=a.trys).length>0&&r[r.length-1])||6!==s[0]&&2!==s[0])){a=0;continue}if(3===s[0]&&(!r||s[1]>r[0]&&s[1]<r[3])){a.label=s[1];break}if(6===s[0]&&a.label<r[1]){a.label=r[1],r=s;break}if(r&&a.label<r[2]){a.label=r[2],a.ops.push(s);break}r[2]&&a.ops.pop(),a.trys.pop();continue}s=e.call(t,a)}catch(t){s=[6,t],o=0}finally{n=r=0}if(5&s[0])throw s[1];return{value:s[0]?s[1]:void 0,done:!0}}([s,c])}}}(this,(function(e){switch(e.label){case 0:return Object.keys(d).forEach((function(e){d[e].on("change",(function(n){t.commit("ReplicantModule/setState",{name:e,val:n})}))})),[4,NodeCG.waitForReplicants.apply(NodeCG,Object.keys(d).map((function(t){return d[t]})))];case 1:return e.sent(),(0,l.f_)(h,t),[2]}}))},new((o=Promise)||(o=Promise))((function(t,i){function a(t){try{c(r.next(t))}catch(t){i(t)}}function s(t){try{c(r.throw(t))}catch(t){i(t)}}function c(e){var n;e.done?t(e.value):(n=e.value,n instanceof o?n:new o((function(t){t(n)}))).then(a,s)}c((r=r.apply(e,n||[])).next())}));var e,n,o,r})(T).then((function(){new r.Ay({vuetify:g.A,i18n:i.A,store:T,el:"#App",render:function(t){return t(j)}})}))},8969:(t,e,n)=>{"use strict";"undefined"!=typeof Reflect&&Reflect.getMetadata},208:(t,e,n)=>{"use strict";n.d(e,{mM:()=>i,vt:()=>a});var o=n(9437),r=n(5596);(0,o.o)("carousel-transition"),(0,o.o)("carousel-reverse-transition"),(0,o.o)("tab-transition"),(0,o.o)("tab-reverse-transition"),(0,o.o)("menu-transition"),(0,o.o)("fab-transition","center center","out-in"),(0,o.o)("dialog-transition"),(0,o.o)("dialog-bottom-transition"),(0,o.o)("dialog-top-transition");const i=(0,o.o)("fade-transition"),a=((0,o.o)("scale-transition"),(0,o.o)("scroll-x-transition"),(0,o.o)("scroll-x-reverse-transition"),(0,o.o)("scroll-y-transition"),(0,o.o)("scroll-y-reverse-transition"),(0,o.o)("slide-x-transition"));(0,o.o)("slide-x-reverse-transition"),(0,o.o)("slide-y-transition"),(0,o.o)("slide-y-reverse-transition"),(0,o.b)("expand-transition",(0,r.A)()),(0,o.b)("expand-x-transition",(0,r.A)("",!0))},4442:(t,e,n)=>{"use strict";n.d(e,{W:()=>a});var o=n(9340),r=n(7098);function i(t,e){return()=>(0,r.OP)(`The ${t} component must be used inside a ${e}`)}function a(t,e,n){const r=e&&n?{register:i(e,n),unregister:i(e,n)}:null;return o.Ay.extend({name:"registrable-inject",inject:{[t]:{default:r}}})}},1290:(t,e,n)=>{"use strict";n.d(e,{P:()=>r});var o=n(9340);function r(t="value",e="input"){return o.Ay.extend({name:"toggleable",model:{prop:t,event:e},props:{[t]:{required:!1}},data(){return{isActive:!!this[t]}},watch:{[t](t){this.isActive=!!t},isActive(n){!!n!==this[t]&&this.$emit(e,n)}}})}r()},7503:(t,e,n)=>{"use strict";n.d(e,{I:()=>s});var o=n(5247),r=n(9868),i=n(6943);function a(t,e={}){const n={container:document.scrollingElement||document.body||document.documentElement,duration:500,offset:0,easing:"easeInOutCubic",appOffset:!0,...e},o=(0,i.M)(n.container);if(n.appOffset&&a.framework.application){const t=o.classList.contains("v-navigation-drawer"),e=o.classList.contains("v-navigation-drawer--clipped"),{bar:r,top:i}=a.framework.application;n.offset+=r,t&&!e||(n.offset+=i)}const s=performance.now();let c;c="number"==typeof t?(0,i.A)(t)-n.offset:(0,i.A)(t)-(0,i.A)(o)-n.offset;const l=o.scrollTop;if(c===l)return Promise.resolve(c);const u="function"==typeof n.easing?n.easing:r[n.easing];if(!u)throw new TypeError(`Easing function "${n.easing}" not found.`);return new Promise((t=>requestAnimationFrame((function e(r){const i=r-s,a=Math.abs(n.duration?Math.min(i/n.duration,1):1);o.scrollTop=Math.floor(l+(c-l)*u(a));const p=(o===document.body?document.documentElement.clientHeight:o.clientHeight)+o.scrollTop>=o.scrollHeight;if(1===a||c>o.scrollTop&&p)return t(c);requestAnimationFrame(e)}))))}a.framework={},a.init=()=>{};class s extends o.k{constructor(){return super(),a}}s.property="goTo"},7098:(t,e,n)=>{"use strict";n.d(e,{OP:()=>i,q4:()=>s,yA:()=>a});var o=n(7028);function r(t,e,n){if(!o.A.config.silent){if(n&&(e={_isVue:!0,$parent:n,$options:e}),e){if(e.$_alreadyWarned=e.$_alreadyWarned||[],e.$_alreadyWarned.includes(t))return;e.$_alreadyWarned.push(t)}return`[Vuetify] ${t}`+(e?function(t){if(t._isVue&&t.$parent){const e=[];let n=0;for(;t;){if(e.length>0){const o=e[e.length-1];if(o.constructor===t.constructor){n++,t=t.$parent;continue}n>0&&(e[e.length-1]=[o,n],n=0)}e.push(t),t=t.$parent}return"\n\nfound in\n\n"+e.map(((t,e)=>`${0===e?"---\x3e ":" ".repeat(5+2*e)}${Array.isArray(t)?`${u(t[0])}... (${t[1]} recursive calls)`:u(t)}`)).join("\n")}return`\n\n(found in ${u(t)})`}(e):"")}}function i(t,e,n){const o=r(t,e,n);null!=o&&console.warn(o)}function a(t,e,n){const o=r(t,e,n);null!=o&&console.error(o)}function s(t,e,n,o){a(`[BREAKING] '${t}' has been removed, use '${e}' instead. For more information, see the upgrade guide https://github.com/vuetifyjs/vuetify/releases/tag/v2.0.0#user-content-upgrade-guide`,n,o)}const c=/(?:^|[-_])(\w)/g,l=t=>t.replace(c,(t=>t.toUpperCase())).replace(/[-_]/g,"");function u(t,e){if(t.$root===t)return"<Root>";const n="function"==typeof t&&null!=t.cid?t.options:t._isVue?t.$options||t.constructor.options:t||{};let o=n.name||n._componentTag;const r=n.__file;if(!o&&r){const t=r.match(/([^/\\]+)\.vue$/);o=t&&t[1]}return(o?`<${l(o)}>`:"<Anonymous>")+(r&&!1!==e?` at ${r}`:"")}},7290:(t,e,n)=>{"use strict";n.d(e,{$c:()=>v,BN:()=>y,D9:()=>w,Dg:()=>c,HP:()=>d,LJ:()=>r,PT:()=>m,Zb:()=>g,bD:()=>i,fF:()=>s,g8:()=>f,kW:()=>l,no:()=>a,qE:()=>b,uP:()=>p});let o=!1;try{if("undefined"!=typeof window){const t=Object.defineProperty({},"passive",{get:()=>{o=!0}});window.addEventListener("testListener",t,t),window.removeEventListener("testListener",t,t)}}catch(t){console.warn(t)}function r(t,e,n){const o=e.length-1;if(o<0)return void 0===t?n:t;for(let r=0;r<o;r++){if(null==t)return n;t=t[e[r]]}return null==t||void 0===t[e[o]]?n:t[e[o]]}function i(t,e){if(t===e)return!0;if(t instanceof Date&&e instanceof Date&&t.getTime()!==e.getTime())return!1;if(t!==Object(t)||e!==Object(e))return!1;const n=Object.keys(t);return n.length===Object.keys(e).length&&n.every((n=>i(t[n],e[n])))}function a(t,e,n){return null!=t&&e&&"string"==typeof e?void 0!==t[e]?t[e]:r(t,(e=(e=e.replace(/\[(\w+)\]/g,".$1")).replace(/^\./,"")).split("."),n):n}function s(t,e){const n={};for(let o=0;o<e.length;o++){const r=e[o];void 0!==t[r]&&(n[r]=t[r])}return n}function c(t,e="px"){return null==t||""===t?void 0:isNaN(+t)?String(t):`${Number(t)}${e}`}function l(t){return(t||"").replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}function u(t){return null!==t&&"object"==typeof t}const p=Object.freeze({enter:13,tab:9,delete:46,esc:27,space:32,up:38,down:40,left:37,right:39,end:35,home:36,del:46,backspace:8,insert:45,pageup:33,pagedown:34,shift:16});function f(t,e){const n=t.$vuetify.icons.component;if(e.startsWith("$")){const n=a(t,`$vuetify.icons.values.${e.split("$").pop().split(".").pop()}`,e);if("string"!=typeof n)return n;e=n}return null==n?e:{component:n,props:{icon:e}}}function d(t){return Object.keys(t)}const h=/-(\w)/g,m=t=>t.replace(h,((t,e)=>e?e.toUpperCase():""));function g(t){return t.charAt(0).toUpperCase()+t.slice(1)}function y(t){return null!=t?Array.isArray(t)?t:[t]:[]}function v(t,e="default",n,o=!1){const r=l(e);return t.$scopedSlots.hasOwnProperty(e)?t.$scopedSlots[e](n instanceof Function?n():n):t.$scopedSlots.hasOwnProperty(r)?t.$scopedSlots[r](n instanceof Function?n():n):!t.$slots.hasOwnProperty(e)||n&&!o?!t.$slots.hasOwnProperty(r)||n&&!o?void 0:t.$slots[r]:t.$slots[e]}function b(t,e=0,n=1){return Math.max(e,Math.min(n,t))}function w(t={},e={}){for(const n in e){const o=t[n],r=e[n];u(o)&&u(r)?t[n]=w(o,r):t[n]=r}return t}}},n={};function o(t){var r=n[t];if(void 0!==r)return r.exports;var i=n[t]={exports:{}};return e[t](i,i.exports,o),i.exports}o.m=e,t=[],o.O=(e,n,r,i)=>{if(!n){var a=1/0;for(u=0;u<t.length;u++){for(var[n,r,i]=t[u],s=!0,c=0;c<n.length;c++)(!1&i||a>=i)&&Object.keys(o.O).every((t=>o.O[t](n[c])))?n.splice(c--,1):(s=!1,i<a&&(a=i));if(s){t.splice(u--,1);var l=r();void 0!==l&&(e=l)}}return e}i=i||0;for(var u=t.length;u>0&&t[u-1][2]>i;u--)t[u]=t[u-1];t[u]=[n,r,i]},o.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return o.d(e,{a:e}),e},o.d=(t,e)=>{for(var n in e)o.o(e,n)&&!o.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},o.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),o.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},(()=>{var t={658:0};o.O.j=e=>0===t[e];var e=(e,n)=>{var r,i,[a,s,c]=n,l=0;if(a.some((e=>0!==t[e]))){for(r in s)o.o(s,r)&&(o.m[r]=s[r]);if(c)var u=c(o)}for(e&&e(n);l<a.length;l++)i=a[l],o.o(t,i)&&t[i]&&t[i][0](),t[i]=0;return o.O(u)},n=self.webpackChunk=self.webpackChunk||[];n.forEach(e.bind(null,0)),n.push=e.bind(null,n.push.bind(n))})();var r=o.O(void 0,[302,680,819,418,950,642],(()=>o(2182)));r=o.O(r)})();