/** Resolves host colors over opaque category defaults without refreshing the diagram. */
export function observeDiagramTheme(element: HTMLElement): () => void {
 const root=element.ownerDocument.documentElement;
 const host=element.closest<HTMLElement>('.interlis-webview')??root;
 const pixel=element.ownerDocument.createElement('canvas');
 pixel.width=pixel.height=1;
 const context=pixel.getContext('2d');
 if(!context)return ()=>{};
 const roles=[
  ['--diagram-background','--vscode-editor-background','--diagram-canvas-fallback'],
  ['--diagram-foreground','--vscode-editor-foreground','--diagram-text-fallback'],
  ['--diagram-surface','--vscode-editorWidget-background','--diagram-surface-fallback'],
 ] as const;
 const update=()=>{
  const style=getComputedStyle(host);
  for(const [role,token,fallback] of roles){
   context.clearRect(0,0,1,1);
   context.fillStyle=style.getPropertyValue(fallback).trim();
   context.fillRect(0,0,1,1);
   context.fillStyle='transparent';
   const color=style.getPropertyValue(token).trim();
   if(color)context.fillStyle=color;
   context.fillRect(0,0,1,1);
   const [r,g,b]=context.getImageData(0,0,1,1).data;
   const paint='rgb('+r+', '+g+', '+b+')';
   if(host.style.getPropertyValue(role)!==paint)host.style.setProperty(role,paint);
  }
 };
 update();
 const observer=new MutationObserver(update);
 const options={attributes:true,attributeFilter:['class','style']};
 observer.observe(root,options);
 if(host!==root)observer.observe(host,options);
 return ()=>observer.disconnect();
}
