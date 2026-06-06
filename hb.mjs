import sharp from 'sharp';
const C='/Users/karimeperez/.claude/image-cache/b7c4e628-33de-48a7-855d-300604f01192';
// key del fondo kraft (esquina) a transparente
const img=sharp(`${C}/14.png`).ensureAlpha();
const {data,info}=await img.raw().toBuffer({resolveWithObject:true});
const ch=info.channels, br=data[0],bg=data[1],bb=data[2];
const out=Buffer.from(data);
for(let i=0;i<data.length;i+=ch){const dist=Math.max(Math.abs(data[i]-br),Math.abs(data[i+1]-bg),Math.abs(data[i+2]-bb));if(dist<=26) out[i+3]=0;}
await sharp(out,{raw:{width:info.width,height:info.height,channels:ch}}).trim({threshold:6}).resize({width:560,withoutEnlargement:true}).png({compressionLevel:9}).toFile('public/cumple/happybday.png');
console.log('happybday corner',br,bg,bb,Math.round((await import('fs')).statSync('public/cumple/happybday.png').size/1024)+'KB');
// preview sobre kraft
const kr=await sharp('public/cumple/kraft.jpg').resize(360,160,{fit:'cover'}).toBuffer();
const hb=await sharp('public/cumple/happybday.png').resize({width:300}).toBuffer();
const hm=await sharp(hb).metadata();
await sharp(kr).composite([{input:hb,left:Math.round((360-hm.width)/2),top:Math.round((160-hm.height)/2)}]).jpeg().toFile('/tmp/hb_prev.jpg');
console.log('preview ok', hm.width+'x'+hm.height);
