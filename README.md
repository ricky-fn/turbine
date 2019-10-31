# Turbine Javascript Framework
![npm](https://img.shields.io/badge/npm-5.6.0-brightgreen.svg)
![node](https://img.shields.io/badge/node-8.11.3-brightgreen.svg)

<div style="text-align:center; margin: 40px 0;"><img src="https://filebin.net/38bn6kek48rmcvau/2367721814_70c44f50-5013-4049-8798-48012992c398.png?t=wsb88fsm"/></div>

This is a SPA project, It's created with corn concept of [Vue](https://github.com/vuejs/vue), It coded by ES6 Syntax and based on [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) pattern.

# Features
- Mixed Javascript Syntax with HTML code, you can be able to describe the relationship between operational code and UI component.
- HTML View will automatically update after described data has been changed, so you don't have to care how to let update tags, because this process is in good hand with Turbine.
- Powerful directive support, all directives as like a hook marked a HTML tag with prefix `'t-'`, multiple default directives such as `'t-for'` for loop a dom from data, `'t-if'` for logic estimate, `'t-bind'` for binding attributes of HTML Tag, `'t-on'` for binding Events etc, these are effective to build complex logic and make things easier.
- The compatibility covered IE 8+, Firfox, Chrome, Edge etc.
- It has only 33KB (after compress).


# Getting Started


### Installing
You can install Turbine via npm installation
```bash
npm install @a2604882741z/turbine --save-dev
```

### Tourist Guide
Import it at the beginning of your porject's entry
```bash
import Turbine from "@a2604882741z/turbine";
```

#### A basic [example](https://codesandbox.io/s/turbinestartup-4p8xu?fontsize=14)
how to initialize a Turbine object:
```HTML
code:
<turbine id="myFirstTurbineApp"></turbine>
<script>
	Turbine({
    	el: "#myFirstTurbineApp"
    });
</script>

result:
<div id="myFirstTurbineApp"></div>
```
`el` is a key to tell Turbine which node shall be used as root target, it supports string or html object.


#### Render from data:
then we gonna put some data and render it into the HTML:
```HTML
code:
<turbine id="myFirstTurbineApp">{{message}}</turbine>
<script>
	Turbine({
    	el: "#myFirstTurbineApp",
        data: {
        	message: "hello world"
        }
    });
</script>

result:
<div id="myfirstTurbineApp">hello world</div>
```
`data` is an Object to gather the values which are used to create reactive response, `The response cause the View update automatically`.

#### Using directive statement:
- Loop statement [example](https://codesandbox.io/s/turbineinitialization-c83n3?fontsize=14):
```bash
code:
<turbine id="myFirstTurbineApp">
	<div t-for="(i, index) in array">{{i + ' ' + index}}</div>
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
    data: {
      	array: [1,2,3]
    }
});

result:
<div id="myfirstTurbineApp">
	<div>1 0</div>
	<div>2 1</div>
	<div>3 2</div>
</div>
```
- Conditional statement [example](https://codesandbox.io/s/turbineconditionstatement-t8ju0?fontsize=14):
```bash
code:
<turbine id="myFirstTurbineApp">
	<div t-if="showText">this element won't output into the HTML Tree</div>
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
    data: {
      	showText: false
    }
});

result:
<div id="myfirstTurbineApp"></div>
```
- Attribute binding statement [example](https://codesandbox.io/s/turbineinitialization-903iy?fontsize=14):
```bash
code:
<turbine id="myFirstTurbineApp">
	<div t-bind:class="className">this tag will have a className as "pink"</div>
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
    data: {
      	className: "pink"
    }
});

result:
<div id="myfirstTurbineApp">
	<div class="pink">this tag will have a className as "pink"</div>
</div>
```
- EventListener [example](https://codesandbox.io/s/turbineeventbinding-2zqly?fontsize=14):
```bash
code:
<turbine id="myFirstTurbineApp">
	<div t-on:click="clickEvent()">this tag is clickable</div>
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
	methods: {
    	clickEvent: () => {
        	alert("The tag has been clicked");
        }
    }
});
```
- Model statement [example](https://codesandbox.io/s/turbineinitialization-tfv6f?fontsize=14):
```bash
code:
<turbine id="myFirstTurbineApp">
	<input type="text" t-model="textValue">
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
    data: {
    	textValue: "this value will be automatically changed when user changes the input value"
    }
});
```
- Display statement:
```bash
code:
<turbine id="myFirstTurbineApp">
	<div t-show="display">This element will output with a style statement "display: none;"</div>
</turbine>

Turbine({
    el: "#myFirstTurbineApp",
    data: {
    	display: false
    }
});

result:
<div id="myfirstTurbineApp">
	<div style="display: none;">This element will output with a style statement "display: none;"</div>
</div>
```
- Reference statement [example](https://codesandbox.io/s/turbinereferencestatement-00fm6?fontsize=14):
```bash
// You might want to access some node directly, here is a way to satisfy your wish by using `ref` as an attribute on tag.

<turbine id="myFirstTurbineApp">
	<div ref="aNode">you can assess this node by coding this.$refs.aNode</div>
</turbine>

let app = Turbine({
    el: "#myFirstTurbineApp"
});
console.log(app.$refs.aNode); // print the dom node out
```




# Troubleshooting
If you get into a trouble and want to get help or share how you solved the issue please visit this [page](https://github.com/a2604882741z/turbine/issues).

# Contact me
Github: [link](https://github.com/rickysna/)<br>
Email: [mr.jiangxue@hotmail.com](mailto:mr.jiangxue@hotmail.com)