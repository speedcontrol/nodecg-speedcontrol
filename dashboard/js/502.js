(self.webpackChunk=self.webpackChunk||[]).push([[502],{1503:e=>{e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"search":"Search...","noTwitchGame":"Run has no Twitch game directory listed","searchResultCount":"1 run found. | {count} runs found."},"ja":{"search":"検索","noTwitchGame":"Twitchゲームカテゴリを設定していない走者情報のみ表示","searchResultCount":"1件の走者情報が見つかりました。 | {count}件の走者情報が見つかりました。"}}'),delete e.options._Ctor}},7696:e=>{e.exports=function(e){e.options.__i18n=e.options.__i18n||[],e.options.__i18n.push('{"en":{"playRun":"Play Run","newRunAfter":"Add New Run After","removeRun":"Remove Run"},"ja":{"playRun":"走者情報の実行","newRunAfter":"後ろに走者情報を追加","removeRun":"走者情報の削除"}}'),delete e.options._Ctor}},4751:(e,t,n)=>{"use strict";function i(e){var t;try{var n=(null===(t=nodecg.getDialog(e).querySelector("iframe"))||void 0===t?void 0:t.contentWindow)||null;if(!n)throw new Error("Could not find the iFrame");return n}catch(t){nodecg.log.error('getDialog could not successfully find dialog "'+e+'":',t),window.alert("Attempted to open a NodeCG dialog but failed (if you are using a standalone version of a dashboard panel, this is not yet supported).")}return null}n.d(t,{Yq:()=>i})},6070:(e,t,n)=>{"use strict";n.d(t,{f:()=>s});var i=n(5925),a=n(779);function s(e){return void 0===e&&(e={}),function(t,n){(0,a.l)(e,t,n),(0,i.yh)((function(t,n){(t.props||(t.props={}))[n]=e}))(t,n)}}},779:(e,t,n)=>{"use strict";n.d(t,{l:()=>a});var i="undefined"!=typeof Reflect&&void 0!==Reflect.getMetadata;function a(e,t,n){if(i&&!Array.isArray(e)&&"function"!=typeof e&&!e.hasOwnProperty("type")&&void 0===e.type){var a=Reflect.getMetadata("design:type",t,n);a!==Object&&(e.type=a)}}},2659:(e,t,n)=>{"use strict";n.d(t,{wA:()=>a.ZP,w3:()=>i.Z,fI:()=>s.f,RL:()=>r.R});var i=n(5803),a=n(5925),s=(n(4807),n(7023),n(5654),n(6070)),r=(n(8793),n(5612))},4502:(e,t,n)=>{"use strict";n.d(t,{Z:()=>se});var i,a=n(2659),s=n(4048),r=n.n(s),o=(i=function(e,t){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}i(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}),l=function(e,t,n,i){var a,s=arguments.length,r=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,n):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,n,i);else for(var o=e.length-1;o>=0;o--)(a=e[o])&&(r=(s<3?a(r):s>3?a(t,n,r):a(t,n))||r);return s>3&&r&&Object.defineProperty(t,n,r),r};const u=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return o(t,e),l([(0,a.fI)({type:String,required:!0})],t.prototype,"icon",void 0),l([(0,a.fI)({type:String,required:!0})],t.prototype,"tooltip",void 0),l([(0,a.fI)(Boolean)],t.prototype,"disabled",void 0),l([a.wA],t)}(a.w3);var c=n(5440),p=n(7618),d=n.n(p),h=n(4385),v=n(7019),f=n(8162),m=(0,c.Z)(u,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("v-tooltip",{attrs:{right:"",disabled:e.disabled},scopedSlots:e._u([{key:"activator",fn:function(t){var i=t.on;return[n("v-btn",e._g({attrs:{icon:"",outlined:"",small:"",disabled:e.disabled},on:{click:function(t){return e.$emit("click")}}},i),[n("v-icon",{attrs:{small:""}},[e._v("\n        "+e._s(e.icon)+"\n      ")])],1)]}}])},[e._v(" "),n("span",[e._v(e._s(e.tooltip))])])}),[],!1,null,null,null);const y=m.exports;d()(m,{VBtn:h.Z,VIcon:v.Z,VTooltip:f.Z});var g=n(4751),b=n(2233),x=function(){var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(t,n)};return function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function i(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(i.prototype=n.prototype,new i)}}(),_=function(e,t,n,i){var a,s=arguments.length,r=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,n):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,n,i);else for(var o=e.length-1;o>=0;o--)(a=e[o])&&(r=(s<3?a(r):s>3?a(t,n,r):a(t,n))||r);return s>3&&r&&Object.defineProperty(t,n,r),r},w=function(e,t,n,i){return new(n||(n=Promise))((function(a,s){function r(e){try{l(i.next(e))}catch(e){s(e)}}function o(e){try{l(i.throw(e))}catch(e){s(e)}}function l(e){var t;e.done?a(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(r,o)}l((i=i.apply(e,t||[])).next())}))},C=function(e,t){var n,i,a,s,r={label:0,sent:function(){if(1&a[0])throw a[1];return a[1]},trys:[],ops:[]};return s={next:o(0),throw:o(1),return:o(2)},"function"==typeof Symbol&&(s[Symbol.iterator]=function(){return this}),s;function o(s){return function(o){return function(s){if(n)throw new TypeError("Generator is already executing.");for(;r;)try{if(n=1,i&&(a=2&s[0]?i.return:s[0]?i.throw||((a=i.return)&&a.call(i),0):i.next)&&!(a=a.call(i,s[1])).done)return a;switch(i=0,a&&(s=[2&s[0],a.value]),s[0]){case 0:case 1:a=s;break;case 4:return r.label++,{value:s[1],done:!1};case 5:r.label++,i=s[1],s=[0];continue;case 7:s=r.ops.pop(),r.trys.pop();continue;default:if(!((a=(a=r.trys).length>0&&a[a.length-1])||6!==s[0]&&2!==s[0])){r=0;continue}if(3===s[0]&&(!a||s[1]>a[0]&&s[1]<a[3])){r.label=s[1];break}if(6===s[0]&&r.label<a[1]){r.label=a[1],a=s;break}if(a&&r.label<a[2]){r.label=a[2],r.ops.push(s);break}a[2]&&r.ops.pop(),r.trys.pop();continue}s=t.call(e,r)}catch(e){s=[6,e],i=0}finally{n=a=0}if(5&s[0])throw s[1];return{value:s[0]?s[1]:void 0,done:!0}}([s,o])}}};const A=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return x(t,e),Object.defineProperty(t.prototype,"playerStr",{get:function(){return this.runData.teams.map((function(e){return(e.name?e.name+":":"")+"\n      "+e.players.map((function(e){return e.name})).join(", ")})).join(" vs. ")},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"runFinishTime",{get:function(){return this.runFinishTimes[this.runData.id]},enumerable:!1,configurable:!0}),t.prototype.customDataName=function(e){var t,n,i,a=nodecg.bundleConfig;return(null===(i=((null===(t=a.schedule)||void 0===t?void 0:t.customData)||(null===(n=a.customData)||void 0===n?void 0:n.run)||[]).find((function(t){return t.key===e})))||void 0===i?void 0:i.name)||"? ("+e+")"},t.prototype.playRun=function(){return w(this,void 0,Promise,(function(){var e;return C(this,(function(t){switch(t.label){case 0:return t.trys.push([0,2,,3]),[4,nodecg.sendMessage("changeActiveRun",this.runData.id)];case 1:return t.sent()&&(e=(0,g.Yq)("alert-dialog"))&&e.openDialog({name:"NoTwitchGame"}),[3,3];case 2:return t.sent(),[3,3];case 3:return[2]}}))}))},t.prototype.duplicateRun=function(){var e=(0,g.Yq)("run-modification-dialog");e&&e.openDialog({mode:"Duplicate",runData:this.runData})},t.prototype.addNewRunAfter=function(){var e=(0,g.Yq)("run-modification-dialog");e&&e.openDialog({mode:"New",prevID:this.runData.id})},t.prototype.editRun=function(){var e=(0,g.Yq)("run-modification-dialog");e&&e.openDialog({mode:"EditOther",runData:this.runData})},t.prototype.removeRunConfirm=function(){var e=(0,g.Yq)("alert-dialog");e&&e.openDialog({name:"RemoveRunConfirm",data:{runData:this.runData},func:this.removeRun})},t.prototype.removeRun=function(e){return w(this,void 0,Promise,(function(){return C(this,(function(t){switch(t.label){case 0:if(!e)return[3,4];t.label=1;case 1:return t.trys.push([1,3,,4]),[4,nodecg.sendMessage("removeRun",this.runData.id)];case 2:case 3:return t.sent(),[3,4];case 4:return[2]}}))}))},_([(0,a.fI)({type:Object,required:!0})],t.prototype,"runData",void 0),_([(0,a.fI)(Boolean)],t.prototype,"editor",void 0),_([(0,a.fI)(Boolean)],t.prototype,"disableChange",void 0),_([(0,a.fI)(Boolean)],t.prototype,"moveDisabled",void 0),_([b.Nz.State((function(e){return e.reps.runDataActiveRun}))],t.prototype,"activeRun",void 0),_([b.Nz.State((function(e){return e.reps.runFinishTimes}))],t.prototype,"runFinishTimes",void 0),_([(0,a.wA)({components:{ModifyButton:y}})],t)}(a.w3);var D=n(7696);const R=n.n(D)();var I=n(3844),V=n(4185),k=n(2377),$=n(6248);const P=(0,$.Z)((0,I.d)("expansionPanels","v-expansion-panel","v-expansion-panels"),(0,V.J)("expansionPanel",!0)).extend({name:"v-expansion-panel",props:{disabled:Boolean,readonly:Boolean},data:()=>({content:null,header:null,nextIsActive:!1}),computed:{classes(){return{"v-expansion-panel--active":this.isActive,"v-expansion-panel--next-active":this.nextIsActive,"v-expansion-panel--disabled":this.isDisabled,...this.groupClasses}},isDisabled(){return this.expansionPanels.disabled||this.disabled},isReadonly(){return this.expansionPanels.readonly||this.readonly}},methods:{registerContent(e){this.content=e},unregisterContent(){this.content=null},registerHeader(e){this.header=e,e.$on("click",this.onClick)},unregisterHeader(){this.header=null},onClick(e){e.detail&&this.header.$el.blur(),this.$emit("click",e),this.isReadonly||this.isDisabled||this.toggle()},toggle(){this.$nextTick((()=>this.$emit("change")))}},render(e){return e("div",{staticClass:"v-expansion-panel",class:this.classes,attrs:{"aria-expanded":String(this.isActive)}},(0,k.z9)(this))}});var O=n(1058),S=n(2803),T=n(1954);const Z=(0,$.Z)(S.Z,T.Z,(0,V.f)("expansionPanel","v-expansion-panel-content","v-expansion-panel")).extend().extend({name:"v-expansion-panel-content",data:()=>({isActive:!1}),computed:{parentIsActive(){return this.expansionPanel.isActive}},watch:{parentIsActive:{immediate:!0,handler(e,t){e&&(this.isBooted=!0),null==t?this.isActive=e:this.$nextTick((()=>this.isActive=e))}}},created(){this.expansionPanel.registerContent(this)},beforeDestroy(){this.expansionPanel.unregisterContent()},render(e){return e(O.Fx,this.showLazyContent((()=>[e("div",this.setBackgroundColor(this.color,{staticClass:"v-expansion-panel-content",directives:[{name:"show",value:this.isActive}]}),[e("div",{class:"v-expansion-panel-content__wrap"},(0,k.z9)(this))])])))}});var j=n(5095),B=n(6236);const q=(0,$.Z)(T.Z,(0,V.f)("expansionPanel","v-expansion-panel-header","v-expansion-panel")).extend().extend({name:"v-expansion-panel-header",directives:{ripple:B.Z},props:{disableIconRotate:Boolean,expandIcon:{type:String,default:"$expand"},hideActions:Boolean,ripple:{type:[Boolean,Object],default:!1}},data:()=>({hasMousedown:!1}),computed:{classes(){return{"v-expansion-panel-header--active":this.isActive,"v-expansion-panel-header--mousedown":this.hasMousedown}},isActive(){return this.expansionPanel.isActive},isDisabled(){return this.expansionPanel.isDisabled},isReadonly(){return this.expansionPanel.isReadonly}},created(){this.expansionPanel.registerHeader(this)},beforeDestroy(){this.expansionPanel.unregisterHeader()},methods:{onClick(e){this.$emit("click",e)},genIcon(){const e=(0,k.z9)(this,"actions")||[this.$createElement(j.Z,this.expandIcon)];return this.$createElement(O.Z5,[this.$createElement("div",{staticClass:"v-expansion-panel-header__icon",class:{"v-expansion-panel-header__icon--disable-rotate":this.disableIconRotate},directives:[{name:"show",value:!this.isDisabled}]},e)])}},render(e){return e("button",this.setBackgroundColor(this.color,{staticClass:"v-expansion-panel-header",class:this.classes,attrs:{tabindex:this.isDisabled?-1:null,type:"button","aria-expanded":this.isActive},directives:[{name:"ripple",value:this.ripple}],on:{...this.$listeners,click:this.onClick,mousedown:()=>this.hasMousedown=!0,mouseup:()=>this.hasMousedown=!1}}),[(0,k.z9)(this,"default",{open:this.isActive},!0),this.hideActions||this.genIcon()])}});var M=(0,c.Z)(A,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("v-expansion-panel",{class:{"grey darken-2":!e.editor&&e.activeRun&&e.activeRun.id===e.runData.id},style:{"overflow-x":"hidden"}},[n("v-expansion-panel-header",[n("span",[e.moveDisabled?e._e():n("v-icon",{staticClass:"Handle",style:{cursor:"move"}},[e._v("\n        mdi-drag-vertical\n      ")]),e._v("\n      "+e._s(e.runData.game)+"\n    ")],1)]),e._v(" "),n("v-expansion-panel-content",{staticClass:"body-2",style:{"overflow-wrap":"break-word"}},[e.playerStr?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("players"))+":")]),e._v(" "),n("span",[e._v(e._s(e.playerStr))])]):e._e(),e._v(" "),e.runData.category?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("category"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runData.category))])]):e._e(),e._v(" "),e.runData.estimate?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("estimate"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runData.estimate))])]):e._e(),e._v(" "),e.runData.system?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("system"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runData.system))])]):e._e(),e._v(" "),e.runData.region?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("region"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runData.region))])]):e._e(),e._v(" "),e.runData.release?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("released"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runData.release))])]):e._e(),e._v(" "),e.runData.relay?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("relay"))+":")]),e._v(" "),n("span",[e._v("✅")])]):e._e(),e._v(" "),e.runFinishTime?n("div",[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.$t("finalTime"))+":")]),e._v(" "),n("span",[e._v(e._s(e.runFinishTime.time))])]):e._e(),e._v(" "),e._l(e.runData.customData,(function(t,i){return n("div",{key:i},[n("span",{staticClass:"font-weight-bold"},[e._v(e._s(e.customDataName(i))+":")]),e._v(" "),n("span",[e._v(e._s(t))])])})),e._v(" "),n("div",{staticStyle:{"margin-top":"10px"}},[e.editor?n("div",[n("modify-button",{attrs:{icon:"mdi-content-duplicate",tooltip:e.$t("duplicateRun")},on:{click:e.duplicateRun}}),e._v(" "),n("modify-button",{attrs:{icon:"mdi-file-plus-outline",tooltip:e.$t("newRunAfter")},on:{click:e.addNewRunAfter}}),e._v(" "),n("modify-button",{attrs:{icon:"mdi-square-edit-outline",tooltip:e.$t("editRun")},on:{click:e.editRun}}),e._v(" "),n("modify-button",{attrs:{icon:"mdi-file-remove-outline",tooltip:e.$t("removeRun")},on:{click:e.removeRunConfirm}})],1):n("div",[n("modify-button",{attrs:{icon:"mdi-play",tooltip:e.$t("playRun"),disabled:e.disableChange},on:{click:e.playRun}})],1)])],2)],1)}),[],!1,null,null,null);"function"==typeof R&&R(M);const E=M.exports;d()(M,{VExpansionPanel:P,VExpansionPanelContent:Z,VExpansionPanelHeader:q,VIcon:v.Z});var N=function(){var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(t,n)};return function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function i(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(i.prototype=n.prototype,new i)}}(),F=function(e,t,n,i){var a,s=arguments.length,r=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,n):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,n,i);else for(var o=e.length-1;o>=0;o--)(a=e[o])&&(r=(s<3?a(r):s>3?a(t,n,r):a(t,n))||r);return s>3&&r&&Object.defineProperty(t,n,r),r};const L=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.searchTerm="",t.hasNoTwitch=!1,t}return N(t,e),Object.defineProperty(t.prototype,"runDataArray",{get:function(){return b.OV.reps.runDataArray},set:function(e){this.$store.commit("updateRunOrder",e)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"filteredRunDataArray",{get:function(){var e=this;return this.runDataArray.filter((function(t){var n=e.searchTerm?e.searchTerm.toLowerCase():"";return(!n||n&&(t.game&&t.game.toLowerCase().includes(n)||!!t.teams.find((function(e){return e.name&&e.name.toLowerCase().includes(n)||!!e.players.find((function(e){return e.name.toLowerCase().includes(n)}))}))))&&(e.hasNoTwitch&&!t.gameTwitch||!e.hasNoTwitch)}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"disableChange",{get:function(){return["running","paused"].includes(this.timer.state)},enumerable:!1,configurable:!0}),t.prototype.onActiveRunChange=function(e){this.editor||this.scroll(e)},t.prototype.scroll=function(e){e?this.$vuetify.goTo("#run-"+e.id,{offset:25,container:".RunList"}):this.$vuetify.goTo(0,{container:".RunList"})},t.prototype.mounted=function(){this.editor||this.scroll(this.activeRun)},F([(0,a.fI)(Boolean)],t.prototype,"editor",void 0),F([b.Nz.State((function(e){return e.reps.runDataActiveRun}))],t.prototype,"activeRun",void 0),F([b.Nz.State((function(e){return e.reps.twitchAPIData}))],t.prototype,"twitchAPIData",void 0),F([b.Nz.State((function(e){return e.reps.timer}))],t.prototype,"timer",void 0),F([(0,a.RL)("activeRun")],t.prototype,"onActiveRunChange",null),F([(0,a.wA)({components:{Draggable:r(),RunPanel:E}})],t)}(a.w3);var z=n(1503);const G=n.n(z)();var H=n(320),K=n(5803);const Y=K.Z.extend({name:"rippleable",directives:{ripple:B.Z},props:{ripple:{type:[Boolean,Object],default:!0}},methods:{genRipple(e={}){return this.ripple?(e.staticClass="v-input--selection-controls__ripple",e.directives=e.directives||[],e.directives.push({name:"ripple",value:{center:!0}}),this.$createElement("div",e)):null}}}),J=K.Z.extend({name:"comparable",props:{valueComparator:{type:Function,default:k.vZ}}});function Q(e){e.preventDefault()}const W=(0,$.Z)(H.Z,Y,J).extend({name:"selectable",model:{prop:"inputValue",event:"change"},props:{id:String,inputValue:null,falseValue:null,trueValue:null,multiple:{type:Boolean,default:null},label:String},data(){return{hasColor:this.inputValue,lazyValue:this.inputValue}},computed:{computedColor(){if(this.isActive)return this.color?this.color:this.isDark&&!this.appIsDark?"white":"primary"},isMultiple(){return!0===this.multiple||null===this.multiple&&Array.isArray(this.internalValue)},isActive(){const e=this.value,t=this.internalValue;return this.isMultiple?!!Array.isArray(t)&&t.some((t=>this.valueComparator(t,e))):void 0===this.trueValue||void 0===this.falseValue?e?this.valueComparator(e,t):Boolean(t):this.valueComparator(t,this.trueValue)},isDirty(){return this.isActive},rippleState(){return this.isDisabled||this.validationState?this.validationState:void 0}},watch:{inputValue(e){this.lazyValue=e,this.hasColor=e}},methods:{genLabel(){const e=H.Z.options.methods.genLabel.call(this);return e?(e.data.on={click:Q},e):e},genInput(e,t){return this.$createElement("input",{attrs:Object.assign({"aria-checked":this.isActive.toString(),disabled:this.isDisabled,id:this.computedId,role:e,type:e},t),domProps:{value:this.value,checked:this.isActive},on:{blur:this.onBlur,change:this.onChange,focus:this.onFocus,keydown:this.onKeydown,click:Q},ref:"input"})},onBlur(){this.isFocused=!1},onClick(e){this.onChange(),this.$emit("click",e)},onChange(){if(!this.isInteractive)return;const e=this.value;let t=this.internalValue;if(this.isMultiple){Array.isArray(t)||(t=[]);const n=t.length;t=t.filter((t=>!this.valueComparator(t,e))),t.length===n&&t.push(e)}else t=void 0!==this.trueValue&&void 0!==this.falseValue?this.valueComparator(t,this.trueValue)?this.falseValue:this.trueValue:e?this.valueComparator(t,e)?null:e:!t;this.validate(!0,t),this.internalValue=t,this.hasColor=t},onFocus(){this.isFocused=!0},onKeydown(e){}}}).extend({name:"v-checkbox",props:{indeterminate:Boolean,indeterminateIcon:{type:String,default:"$checkboxIndeterminate"},offIcon:{type:String,default:"$checkboxOff"},onIcon:{type:String,default:"$checkboxOn"}},data(){return{inputIndeterminate:this.indeterminate}},computed:{classes(){return{...H.Z.options.computed.classes.call(this),"v-input--selection-controls":!0,"v-input--checkbox":!0,"v-input--indeterminate":this.inputIndeterminate}},computedIcon(){return this.inputIndeterminate?this.indeterminateIcon:this.isActive?this.onIcon:this.offIcon},validationState(){if(!this.isDisabled||this.inputIndeterminate)return this.hasError&&this.shouldValidate?"error":this.hasSuccess?"success":null!==this.hasColor?this.computedColor:void 0}},watch:{indeterminate(e){this.$nextTick((()=>this.inputIndeterminate=e))},inputIndeterminate(e){this.$emit("update:indeterminate",e)},isActive(){this.indeterminate&&(this.inputIndeterminate=!1)}},methods:{genCheckbox(){const{title:e,...t}=this.attrs$;return this.$createElement("div",{staticClass:"v-input--selection-controls__input"},[this.$createElement(j.Z,this.setTextColor(this.validationState,{props:{dense:this.dense,dark:this.dark,light:this.light}}),this.computedIcon),this.genInput("checkbox",{...t,"aria-checked":this.inputIndeterminate?"mixed":this.isActive.toString()}),this.genRipple(this.setTextColor(this.rippleState))])},genDefaultSlot(){return[this.genCheckbox(),this.genLabel()]}}});var U=n(312),X=n(9405),ee=n(8298);const te=(0,$.Z)(U.Z,X.Z).extend({name:"base-item-group",props:{activeClass:{type:String,default:"v-item--active"},mandatory:Boolean,max:{type:[Number,String],default:null},multiple:Boolean,tag:{type:String,default:"div"}},data(){return{internalLazyValue:void 0!==this.value?this.value:this.multiple?[]:void 0,items:[]}},computed:{classes(){return{"v-item-group":!0,...this.themeClasses}},selectedIndex(){return this.selectedItem&&this.items.indexOf(this.selectedItem)||-1},selectedItem(){if(!this.multiple)return this.selectedItems[0]},selectedItems(){return this.items.filter(((e,t)=>this.toggleMethod(this.getValue(e,t))))},selectedValues(){return null==this.internalValue?[]:Array.isArray(this.internalValue)?this.internalValue:[this.internalValue]},toggleMethod(){if(!this.multiple)return e=>this.internalValue===e;const e=this.internalValue;return Array.isArray(e)?t=>e.includes(t):()=>!1}},watch:{internalValue:"updateItemsState",items:"updateItemsState"},created(){this.multiple&&!Array.isArray(this.internalValue)&&(0,ee.Kd)("Model must be bound to an array if the multiple property is true.",this)},methods:{genData(){return{class:this.classes}},getValue:(e,t)=>null==e.value||""===e.value?t:e.value,onClick(e){this.updateInternalValue(this.getValue(e,this.items.indexOf(e)))},register(e){const t=this.items.push(e)-1;e.$on("change",(()=>this.onClick(e))),this.mandatory&&!this.selectedValues.length&&this.updateMandatory(),this.updateItem(e,t)},unregister(e){if(this._isDestroyed)return;const t=this.items.indexOf(e),n=this.getValue(e,t);if(this.items.splice(t,1),!(this.selectedValues.indexOf(n)<0)){if(!this.mandatory)return this.updateInternalValue(n);this.multiple&&Array.isArray(this.internalValue)?this.internalValue=this.internalValue.filter((e=>e!==n)):this.internalValue=void 0,this.selectedItems.length||this.updateMandatory(!0)}},updateItem(e,t){const n=this.getValue(e,t);e.isActive=this.toggleMethod(n)},updateItemsState(){this.$nextTick((()=>{if(this.mandatory&&!this.selectedItems.length)return this.updateMandatory();this.items.forEach(this.updateItem)}))},updateInternalValue(e){this.multiple?this.updateMultiple(e):this.updateSingle(e)},updateMandatory(e){if(!this.items.length)return;const t=this.items.slice();e&&t.reverse();const n=t.find((e=>!e.disabled));if(!n)return;const i=this.items.indexOf(n);this.updateInternalValue(this.getValue(n,i))},updateMultiple(e){const t=(Array.isArray(this.internalValue)?this.internalValue:[]).slice(),n=t.findIndex((t=>t===e));this.mandatory&&n>-1&&t.length-1<1||null!=this.max&&n<0&&t.length+1>this.max||(n>-1?t.splice(n,1):t.push(e),this.internalValue=t)},updateSingle(e){const t=e===this.internalValue;this.mandatory&&t||(this.internalValue=t?void 0:e)}},render(e){return e(this.tag,this.genData(),this.$slots.default)}}),ne=(te.extend({name:"v-item-group",provide(){return{itemGroup:this}}}),te.extend({name:"v-expansion-panels",provide(){return{expansionPanels:this}},props:{accordion:Boolean,disabled:Boolean,flat:Boolean,hover:Boolean,focusable:Boolean,inset:Boolean,popout:Boolean,readonly:Boolean,tile:Boolean},computed:{classes(){return{...te.options.computed.classes.call(this),"v-expansion-panels":!0,"v-expansion-panels--accordion":this.accordion,"v-expansion-panels--flat":this.flat,"v-expansion-panels--hover":this.hover,"v-expansion-panels--focusable":this.focusable,"v-expansion-panels--inset":this.inset,"v-expansion-panels--popout":this.popout,"v-expansion-panels--tile":this.tile}}},created(){this.$attrs.hasOwnProperty("expand")&&(0,ee.fK)("expand","multiple",this),Array.isArray(this.value)&&this.value.length>0&&"boolean"==typeof this.value[0]&&(0,ee.fK)(':value="[true, false, true]"',':value="[0, 2]"',this)},methods:{updateItem(e,t){const n=this.getValue(e,t),i=this.getValue(e,t+1);e.isActive=this.toggleMethod(n),e.nextIsActive=this.toggleMethod(i)}}}));var ie=n(3069),ae=(0,c.Z)(L,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("v-text-field",{attrs:{filled:"",clearable:"",label:e.$t("search"),"append-icon":"mdi-magnify",messages:e.$tc("searchResultCount",e.filteredRunDataArray.length)},model:{value:e.searchTerm,callback:function(t){e.searchTerm=t},expression:"searchTerm"}}),e._v(" "),e.editor&&"on"===e.twitchAPIData.state?n("div",[n("v-checkbox",{staticClass:"ma-1 pa-0",attrs:{"hide-details":"",label:e.$t("noTwitchGame")},model:{value:e.hasNoTwitch,callback:function(t){e.hasNoTwitch=t},expression:"hasNoTwitch"}})],1):e._e(),e._v(" "),n("div",{ref:"runList",staticClass:"RunList",style:{height:"400px","overflow-y":"scroll"}},[n("v-expansion-panels",{attrs:{accordion:""}},[n("draggable",{staticStyle:{width:"100%"},attrs:{handle:".Handle",disabled:e.searchTerm||e.hasNoTwitch||!e.editor},model:{value:e.runDataArray,callback:function(t){e.runDataArray=t},expression:"runDataArray"}},[n("transition-group",{attrs:{name:"list"}},e._l(e.filteredRunDataArray,(function(t){return n("run-panel",{key:t.id,attrs:{id:"run-"+t.id,"run-data":t,editor:e.editor,"disable-change":e.disableChange,"move-disabled":!!e.searchTerm||e.hasNoTwitch||!e.editor}})})),1)],1)],1)],1)],1)}),[],!1,null,"d2541eb6",null);"function"==typeof G&&G(ae);const se=ae.exports;d()(ae,{VCheckbox:W,VExpansionPanels:ne,VTextField:ie.Z})},1058:(e,t,n)=>{"use strict";n.d(t,{Z5:()=>s,Qn:()=>r,Fx:()=>o});var i=n(2727),a=n(4240);(0,i.q)("carousel-transition"),(0,i.q)("carousel-reverse-transition"),(0,i.q)("tab-transition"),(0,i.q)("tab-reverse-transition"),(0,i.q)("menu-transition"),(0,i.q)("fab-transition","center center","out-in"),(0,i.q)("dialog-transition"),(0,i.q)("dialog-bottom-transition"),(0,i.q)("dialog-top-transition");const s=(0,i.q)("fade-transition"),r=((0,i.q)("scale-transition"),(0,i.q)("scroll-x-transition"),(0,i.q)("scroll-x-reverse-transition"),(0,i.q)("scroll-y-transition"),(0,i.q)("scroll-y-reverse-transition"),(0,i.q)("slide-x-transition")),o=((0,i.q)("slide-x-reverse-transition"),(0,i.q)("slide-y-transition"),(0,i.q)("slide-y-reverse-transition"),(0,i.x)("expand-transition",(0,a.Z)()));(0,i.x)("expand-x-transition",(0,a.Z)("",!0))},4185:(e,t,n)=>{"use strict";n.d(t,{f:()=>r,J:()=>o});var i=n(5803),a=n(8298);function s(e,t){return()=>(0,a.Kd)(`The ${e} component must be used inside a ${t}`)}function r(e,t,n){const a=t&&n?{register:s(t,n),unregister:s(t,n)}:null;return i.Z.extend({name:"registrable-inject",inject:{[e]:{default:a}}})}function o(e,t=!1){return i.Z.extend({name:"registrable-provide",provide(){return{[e]:t?this:{register:this.register,unregister:this.unregister}}}})}}}]);