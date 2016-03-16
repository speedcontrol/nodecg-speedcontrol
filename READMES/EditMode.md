# EDIT-Mode

So! You've defined the look & feel of your overlay with player-panels, logos, and everything!
You should at this stage have a HTML document with everything you need, so now it's time to learn
how to design your HTML to take edit-mode into account! the recommended workflow is to first create your
overlay with all the items that you want (Logos, Gamefeeds, Webcam areas, Player panels etc), and then use
Edit Mode to position every single item on the overlay. This should be prepared before the marathon.

## What your overlay HAS to contain to make Edit mode work

```
...
<div id="window-container">
   <div id="positionDebug">
       <div id="positionDebugText">
       </div>
           <div id="editModeButtons">
               <button id="generateCSSContentButton">Save Layout</button>
               <button id="resetCSSContentButton">Reset Layout</button>
            </div>
       </div>
   </div>
</body>
...
```
The above is what HAS to come first in your HTMl document, otherwise you won't have any buttons
to actually save or revert the overlay, and hence you can't benefit from it.

## ID is the key!
If you want your element to be able to be saved and reused later, you NEED to give it a uniqe ID!
If you look at the example files all or almost all the top level `<div>`s have an Id, which is how
edit-mode refers to them when generating the edit-mode data. For instance the following item will
be able to be saved
```
<div id="gameCapture1" class="positionable gameCapture" aspect-ratio="16:9">
</div>
```
while the below won't be able to be saved and produces undocumented behavior

```
<div class="positionable gameCapture" aspect-ratio="16:9">
</div>
```

Below describes a couple of classes and how they affect edit-mode and when you're most likely to use them

### .positionable
any element tagged with `class="positionable"` will be able to be dragged across the screen, hence be repositionable
in the overlay scope. It's designed and only meant to be used for the top containers of your overlay, such as
the timer container, run information container, playerpanels, logos, etc. If you use `class="positionable"` on
an element that has a parent which is not directly under "window-container", you wuill only be able to drag it
inside it's parent.

### .resizable
any element tagged with `class="resizable"` will be able to be.. resizable! which meansyou can drag it's bottom
right corner to make it just as big as you want it to be! great for webcam cutouts, etc. May be paired with
`class="keepproportion"` which will keep the proportions of it when dragging.

### .keepproportion
any element tagged with `class="resizable keepproportion"` will be able to be.. resizable, but the width/height
proportions will be kept. Only works if the element has class resizable as well.

### .gameCapture
an element tagged with `class="gameCapture"` will serve as the gamefeed on the overlay. It's background color
will be fully green which you can color/cromakey away. a gameCapture is also resizable and have
the keepproportion attribute inherently, so you will always keep the aspect ratio when resizing gameCaptures.
If there are multiple gameCapture in an overlay, e.g:
```
<div id="gameCapture1" class="positionable gameCapture" aspect-ratio="16:9">
</div>
<div id="gameCapture2" class="positionable gameCapture" aspect-ratio="16:9">
</div>
```
only the first one will be resizable, BUT the second one will resize with it so you always have the exact same
width/height of several gameCaptures.
If you define `class="gameCapture"` it's mandatory to also provide an "aspect-ratio" attribute in the HTML tag.
This can be free-form like "4:3", "16:9, "124314:213", but the following short-hands are also supported:
* 'GB','GBC' for Gameboy capture, this will default to "10:9"
* 'HD', this will default to "16:9"
* '3DSBottom','SD','DS', will all default to "4:3"
* '3DSTop' will default to "5:3"
* 'GBA' will default to "3:2"

Hence all the following examples are valid:

```
<div id="gameCapture1" class="positionable gameCapture" aspect-ratio="16:9">
</div>
<div id="gameCapture2" class="positionable gameCapture" aspect-ratio="32:12">
</div>
<div id="gameCapture3" class="positionable gameCapture" aspect-ratio="DS">
</div>
<div id="gameCapture4" class="positionable gameCapture" aspect-ratio="3DSTop">
</div>
<div id="gameCapture5" class="positionable gameCapture" aspect-ratio="GBC">
</div>
```
