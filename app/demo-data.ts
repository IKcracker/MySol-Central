export type Site={id:string;name:string;region:string;target:number;latitude:number;longitude:number};
export type Asset={id:string;name:string;type:string;siteId:string;hours:number;health:number;fuel:number;status:"Operational"|"Idle"|"Maintenance";operator:string};
export type WorkOrder={id:string;assetId:string;siteId:string;issue:string;priority:"High"|"Medium"|"Low";status:"Open"|"In progress"|"Resolved";createdAt:string;notes:string};
export type Production={id:string;siteId:string;date:string;shift:"Day"|"Night";tonnes:number;trips:number;notes:string};
export type Customer={id:string;name:string;industry:string;contact:string;email:string;status:"Active"|"Prospect"};
export type Contract={id:string;customerId:string;siteId:string;title:string;value:number;status:"Active"|"Pending"|"Completed";endDate:string};
export type Worker={id:string;name:string;role:string;siteId:string;shift:"Day"|"Night";status:"On duty"|"Off duty"};
export type Store={sites:Site[];assets:Asset[];orders:WorkOrder[];production:Production[];customers:Customer[];contracts:Contract[];workers:Worker[]};
export const DEMO_DATE="2026-11-19";
export const seed:Store={
 sites:[
 {id:"S-01",name:"North Ridge",region:"Rustenburg North",target:3800,latitude:24,longitude:29},
 {id:"S-02",name:"West Pit",region:"Rustenburg West",target:3200,latitude:59,longitude:47},
 {id:"S-03",name:"South Quarry",region:"North West",target:2700,latitude:72,longitude:74},
 {id:"S-04",name:"East Basin",region:"Rustenburg East",target:3100,latitude:27,longitude:75}
 ],
 assets:[
 {id:"EX-104",name:"CAT 395",type:"Excavator",siteId:"S-01",hours:4215,health:94,fuel:77,status:"Operational",operator:"Thabo Mokoena"},
 {id:"DT-221",name:"Volvo A60H",type:"Haul truck",siteId:"S-01",hours:3108,health:88,fuel:59,status:"Operational",operator:"Naledi Khumalo"},
 {id:"DZ-038",name:"Komatsu D155",type:"Dozer",siteId:"S-03",hours:5782,health:54,fuel:41,status:"Maintenance",operator:"Karabo Ndlovu"},
 {id:"EX-118",name:"Hitachi ZX870",type:"Excavator",siteId:"S-02",hours:2834,health:91,fuel:82,status:"Operational",operator:"Sipho Nkosi"},
 {id:"DT-236",name:"CAT 777G",type:"Haul truck",siteId:"S-04",hours:6240,health:76,fuel:65,status:"Idle",operator:"Lebo Molefe"},
 {id:"LD-017",name:"CAT 988K",type:"Wheel loader",siteId:"S-02",hours:1930,health:97,fuel:91,status:"Operational",operator:"Palesa Dlamini"},
 {id:"DT-249",name:"Bell B45E",type:"Haul truck",siteId:"S-03",hours:2168,health:83,fuel:60,status:"Operational",operator:"Mpho Maseko"},
 {id:"EX-139",name:"Komatsu PC1250",type:"Excavator",siteId:"S-04",hours:3984,health:89,fuel:73,status:"Operational",operator:"Tumelo Radebe"}
 ],
 orders:[
 {id:"WO-1048",assetId:"DZ-038",siteId:"S-03",issue:"Hydraulic pressure inspection",priority:"High",status:"In progress",createdAt:"2026-11-19",notes:"Replace damaged hose; check pressure regulator"},
 {id:"WO-1047",assetId:"DT-236",siteId:"S-04",issue:"Scheduled brake inspection",priority:"Medium",status:"Open",createdAt:"2026-11-19",notes:"Inspect brake pads before next night shift"}
 ],
 production:[
 {id:"PR-1001",siteId:"S-01",date:DEMO_DATE,shift:"Day",tonnes:2540,trips:72,notes:"Normal operations"},
 {id:"PR-1002",siteId:"S-02",date:DEMO_DATE,shift:"Day",tonnes:2180,trips:63,notes:"Good crusher throughput"},
 {id:"PR-1003",siteId:"S-03",date:DEMO_DATE,shift:"Day",tonnes:1620,trips:43,notes:"Equipment availability impact"},
 {id:"PR-1004",siteId:"S-04",date:DEMO_DATE,shift:"Day",tonnes:2370,trips:68,notes:"Normal operations"},
 {id:"PR-0994",siteId:"S-01",date:"2026-11-18",shift:"Day",tonnes:3360,trips:91,notes:"Historical sample"},
 {id:"PR-0995",siteId:"S-02",date:"2026-11-18",shift:"Day",tonnes:2890,trips:79,notes:"Historical sample"},
 {id:"PR-0996",siteId:"S-03",date:"2026-11-18",shift:"Day",tonnes:2210,trips:60,notes:"Historical sample"},
 {id:"PR-0997",siteId:"S-04",date:"2026-11-18",shift:"Day",tonnes:2780,trips:77,notes:"Historical sample"}
 ],
 customers:[
 {id:"CU-100",name:"Apex Mineral Resources",industry:"Mining",contact:"L. Peterson",email:"demo@apex.invalid",status:"Active"},
 {id:"CU-101",name:"Kopano Earthworks",industry:"Construction",contact:"P. Nkosi",email:"demo@kopano.invalid",status:"Active"},
 {id:"CU-102",name:"BlueRock Aggregates",industry:"Aggregates",contact:"M. Daniels",email:"demo@bluerock.invalid",status:"Prospect"}
 ],
 contracts:[
 {id:"CT-001",customerId:"CU-100",siteId:"S-01",title:"Opencast loading & hauling",value:12500000,status:"Active",endDate:"2027-06-30"},
 {id:"CT-002",customerId:"CU-101",siteId:"S-02",title:"Bulk earthworks programme",value:4200000,status:"Active",endDate:"2027-03-31"}
 ],
 workers:[
 {id:"EMP-101",name:"Thabo Mokoena",role:"Equipment operator",siteId:"S-01",shift:"Day",status:"On duty"},
 {id:"EMP-102",name:"Naledi Khumalo",role:"Haul truck operator",siteId:"S-01",shift:"Day",status:"On duty"},
 {id:"EMP-103",name:"Karabo Ndlovu",role:"Dozer operator",siteId:"S-03",shift:"Day",status:"Off duty"},
 {id:"EMP-104",name:"Sipho Nkosi",role:"Equipment operator",siteId:"S-02",shift:"Night",status:"On duty"},
 {id:"EMP-105",name:"Palesa Dlamini",role:"Site supervisor",siteId:"S-02",shift:"Day",status:"On duty"}
 ]
};
export const randId=(prefix:string)=>prefix+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
export const number=(n:number)=>new Intl.NumberFormat("en-ZA").format(n);
export const money=(n:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(n);
export const cloneSeed=():Store=>JSON.parse(JSON.stringify(seed));
