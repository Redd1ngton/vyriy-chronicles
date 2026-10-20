// Node's authoritative multiplayer server is deployed separately.
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/health')return Response.json({mode:'static-local',maxPlayers:0});
  if(path.startsWith('/api/'))return Response.json({error:'На цьому сайті доступна локальна гра. Для кооперативу вкажіть адресу окремого сервера кімнат.'},{status:503});
  return env.ASSETS.fetch(request);
 }
};
