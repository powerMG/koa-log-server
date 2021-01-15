const Router = require("koa-router");
const { query } = require("../../db/mysql/DBHelper"); //引入异步查询方法
const { QUERY_DATAS } = require("../../utility/utilityMysql"); //部分引入sql库
const menuRouter = new Router({
  prefix: "/menu",
});

menuRouter.get("/GetMenuList", async (ctx) => {
  let query_res = await query(QUERY_DATAS("sys_menu_info")); //异步方法调用
  ctx.body = {
    code: 1,
    data: query_res,
    message: "获取成功",
  };
});
module.exports = menuRouter;
