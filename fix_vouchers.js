import fs from 'fs';

// 1. Edit CustomerMemberView.tsx
let customerContent = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const oldVoucherCard1 = `                  <div key={v.id} className="flex-[0_0_calc(100%-40px)] max-w-[400px] bg-gradient-to-br from-[#fef08a] to-[#c7d2fe] rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between relative overflow-hidden min-h-[220px]">`;
const newVoucherCard1 = `                  <div key={v.id} className="flex-[0_0_calc(100%-40px)] max-w-[400px] bg-slate-900 text-white rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? \`url('\${v.imagePath}')\` : 'linear-gradient(to bottom right, #fef08a, #c7d2fe)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 bg-black/40 z-0"></div>
                    <div className="relative z-10 h-full flex flex-col">`;
                    
const oldVoucherEnd1 = `                    <div className="flex flex-col items-start gap-2.5 relative mt-auto">`;
const newVoucherEnd1 = `                    <div className="flex flex-col items-start gap-2.5 relative mt-auto z-10">`;

customerContent = customerContent.replace(oldVoucherCard1, newVoucherCard1);
customerContent = customerContent.replace(`<div className="text-xs font-bold tracking-wider mb-1 text-slate-900/80 uppercase">{v.subtitle}</div>`, `<div className="text-xs font-bold tracking-wider mb-1 text-white/90 uppercase drop-shadow-md">{v.subtitle}</div>`);
customerContent = customerContent.replace(`<div className="text-5xl font-bold leading-none mb-1 tracking-tight text-slate-900">`, `<div className="text-5xl font-bold leading-none mb-1 tracking-tight text-white drop-shadow-md">`);
customerContent = customerContent.replace(`<div className="text-base font-semibold mb-1 text-slate-900">{v.title}</div>`, `<div className="text-base font-semibold mb-1 text-white drop-shadow-md">{v.title}</div>`);
customerContent = customerContent.replace(`<div className="text-xs text-slate-600 mb-6 font-medium">Valid until {v.validUntil}</div>`, `<div className="text-xs text-white/80 mb-6 font-medium drop-shadow-md">Valid until {v.validUntil}</div>`);
customerContent = customerContent.replace(`className="bg-slate-900 text-white border-none py-3 px-6 rounded-full text-sm font-semibold cursor-pointer transition-transform hover:scale-105 shadow-md"`, `className="bg-white text-slate-900 border-none py-3 px-6 rounded-full text-sm font-semibold cursor-pointer transition-transform hover:scale-105 shadow-lg"`);
customerContent = customerContent.replace(`                    <div className="flex flex-col items-start gap-2.5 relative mt-auto">`, `                    <div className="flex flex-col items-start gap-2.5 relative mt-auto z-10">`);
customerContent = customerContent.replace(`                  </div>\n                ))} `, `                    </div>\n                  </div>\n                ))}`); // Add closing div for z-10


const oldVoucherCard2 = `                  <div key={v.id} className="w-full bg-slate-900 rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden min-h-[220px]">`;
const newVoucherCard2 = `                  <div key={v.id} className="w-full bg-slate-900 rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? \`url('\${v.imagePath}')\` : 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>`;

customerContent = customerContent.replace(oldVoucherCard2, newVoucherCard2);
customerContent = customerContent.replace(`bg-gradient-to-r from-slate-950 via-slate-900/85 to-transparent z-10`, `bg-black/50 z-10`);
fs.writeFileSync('src/components/CustomerMemberView.tsx', customerContent);

