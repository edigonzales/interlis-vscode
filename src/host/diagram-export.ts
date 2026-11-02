const sax=require('sax') as {parser(strict:boolean,options:{xmlns:boolean}):XmlParser};
interface XmlNode {local:string;uri:string;attributes:Record<string,{name:string;value:string}>;}
interface XmlParser {onopentag?:(node:XmlNode)=>void;onclosetag?:()=>void;ondoctype?:()=>void;onerror?:(error:Error)=>void;write(value:string):XmlParser;close():void;}
/** Strict bounded transport for the local renderer's inert export artifacts. */
export function decodeDiagramExport(format:'SVG'|'PNG',value:unknown):Uint8Array {
 if(typeof value!=='string'||value.length===0||value.length>24_000_000)throw Error('Export exceeds the transport limit');
 if(format==='PNG'){
  if(value.length%4!==0||/[^A-Za-z0-9+/=]/.test(value))throw Error('Invalid PNG encoding');const bytes=Buffer.from(value,'base64');if(bytes.toString('base64')!==value)throw Error('Invalid PNG encoding');if(bytes.length<33||bytes.length>16_000_000||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG artifact');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(!width||!height||width>8192||height>8192||width*height>32_000_000)throw Error('PNG exceeds pixel limits');return bytes;
 }
 if(value.length>16_000_000)throw Error('SVG exceeds the transport limit');
 const parser=sax.parser(true,{xmlns:true}),allowed=new Set(['svg','g','rect','circle','ellipse','text','tspan','path','polygon','polyline','line','defs','mask','clipPath','title','metadata']);let depth=0,count=0,roots=0;
 parser.ondoctype=()=>{throw Error('SVG document types are forbidden');};parser.onerror=error=>{throw error;};
 parser.onopentag=node=>{if(++count>100000||++depth>128||node.uri!=='http://www.w3.org/2000/svg'||!allowed.has(node.local))throw Error('Unsafe SVG element');if(depth===1){roots++;if(node.local!=='svg'||roots!==1)throw Error('Invalid SVG root');}if(Object.keys(node.attributes).length>64)throw Error('Too many SVG attributes');
  for(const attr of Object.values(node.attributes)){if(/^on/i.test(attr.name))throw Error('Active SVG attribute');if(/(?:^|:)href$/i.test(attr.name)&&!/^#[A-Za-z0-9_-]+$/.test(attr.value))throw Error('External SVG resource');if(/url\s*\(/i.test(attr.value)){for(const match of attr.value.matchAll(/url\s*\((.*?)\)/gi))if(!/^#[A-Za-z0-9_-]+$/.test(match[1]))throw Error('External SVG paint');}if(['fill','stroke','filter','mask','clip-path','cursor','marker-start','marker-end'].includes(attr.name)&&attr.value.includes(String.fromCharCode(92)))throw Error('Escaped SVG paint');if(attr.name==='style'&&/[\\]|@import|expression\s*\(/i.test(attr.value))throw Error('Active SVG style');}
 };parser.onclosetag=()=>{depth--;};parser.write(value).close();if(roots!==1||depth!==0)throw Error('Invalid SVG document');return Buffer.from(value,'utf8');
}
