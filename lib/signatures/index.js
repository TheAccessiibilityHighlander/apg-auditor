import accordion      from './accordion.js';
import alert          from './alert.js';
import alertdialog    from './alertdialog.js';
import breadcrumb     from './breadcrumb.js';
import button         from './button.js';
import carousel       from './carousel.js';
import checkbox       from './checkbox.js';
import combobox       from './combobox.js';
import dialog         from './dialog.js';
import disclosure     from './disclosure.js';
import feed           from './feed.js';
import grid           from './grid.js';
import landmarkregions from './landmarkregions.js';
import link           from './link.js';
import listbox        from './listbox.js';
import menu           from './menu.js';
import menubar        from './menubar.js';
import menubutton     from './menubutton.js';
import meter          from './meter.js';
import radiogroup     from './radiogroup.js';
import slider         from './slider.js';
import sliderMultithumb from './slider-multithumb.js';
import spinbutton     from './spinbutton.js';
import switchPattern  from './switch.js';
import table          from './table.js';
import tabs           from './tabs.js';
import toolbar        from './toolbar.js';
import tooltip        from './tooltip.js';
import treegrid       from './treegrid.js';
import treeview       from './treeview.js';
import windowsplitter from './windowsplitter.js';

const SIGNATURES = new Map([
  [accordion.patternName,       accordion],
  [alert.patternName,           alert],
  [alertdialog.patternName,     alertdialog],
  [breadcrumb.patternName,      breadcrumb],
  [button.patternName,          button],
  [carousel.patternName,        carousel],
  [checkbox.patternName,        checkbox],
  [combobox.patternName,        combobox],
  [dialog.patternName,          dialog],
  [disclosure.patternName,      disclosure],
  [feed.patternName,            feed],
  [grid.patternName,            grid],
  [landmarkregions.patternName, landmarkregions],
  [link.patternName,            link],
  [listbox.patternName,         listbox],
  [menu.patternName,            menu],
  [menubar.patternName,         menubar],
  [menubutton.patternName,      menubutton],
  [meter.patternName,           meter],
  [radiogroup.patternName,      radiogroup],
  [slider.patternName,          slider],
  [sliderMultithumb.patternName, sliderMultithumb],
  [spinbutton.patternName,      spinbutton],
  [switchPattern.patternName,   switchPattern],
  [table.patternName,           table],
  [tabs.patternName,            tabs],
  [toolbar.patternName,         toolbar],
  [tooltip.patternName,         tooltip],
  [treegrid.patternName,        treegrid],
  [treeview.patternName,        treeview],
  [windowsplitter.patternName,  windowsplitter],
]);

export default SIGNATURES;
export { SIGNATURES };
