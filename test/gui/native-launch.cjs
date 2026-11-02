const fs=require('fs'),path=require('path');
/** The pinned ExTester hardcodes --disable-workspace-trust. Remove only that launch
 * switch for the actual Trust test; never emulate workspace trust in the product. */
function enableWorkspaceTrust(){const {Options}=require('selenium-webdriver/chrome'),add=Options.prototype.addArguments;Options.prototype.addArguments=function(...args){const actual=args.filter(value=>value!=='--disable-workspace-trust');fs.writeFileSync(path.join(process.env.INTERLIS_GUI_EVIDENCE,'native-trust-launch.json'),JSON.stringify({removedSwitch:'--disable-workspace-trust',actualArguments:actual,reason:'Exercise the genuine Restricted Mode and native Trust UI'},null,2));return add.apply(this,actual);};}
function useSealedCode(){const wrapper=process.env.INTERLIS_GUI_CODE_WRAPPER;if(!wrapper||!fs.existsSync(wrapper))throw Error('Missing isolated Code launcher');const {Options}=require('selenium-webdriver/chrome'),set=Options.prototype.setChromeBinaryPath;Options.prototype.setChromeBinaryPath=function(){return set.call(this,wrapper);};}
module.exports={enableWorkspaceTrust,useSealedCode};
