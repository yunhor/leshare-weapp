import ShopService from "../../../class/service/ShopService";
import GoodsService from "../../../class/service/GoodsService";
import CouponService from "../../../class/service/CouponService";
import AuthService from "../../../class/service/AuthService";
import Router from "../../../class/utils/Router";
import Tips from "../../../class/utils/Tips";

const Tab = require('../../../templates/tab/index');
const app = getApp();
const shopService = new ShopService();
const goodsService = new GoodsService();
const couponService = new CouponService();
const authService = new AuthService();

Page(Object.assign({}, Tab, {
  page: {},
  data: {
    shop: {},
    goods: [],
    notice: [],
    tab: {},
    coupons: []
  },

  /**
   * 页面初始化
   */
  onLoad: function (options) {
    authService.checkLoginCode().then(this.init, this.login);
  },

  /**
   * 用户登录
   */
  login: function () {
    console.info('权限校验失败，与服务器建立新会话');
    return authService.getWxJsCode()
      .then(jsCode => {
        return authService.getLoginCode(jsCode);
      })
      .then(auth => {
        authService.saveAuthInfo(auth);
      })
      .then(() => {
        this.onLoad();
      });
  },


  /**
   * 初始化店铺信息
   */
  init: function () {
    console.info('权限校验成功，会话正常');
    //请求店铺基本信息
    shopService.getInfo().then(data => {
      this.setData({ shop: data });
    })

    //请求公告信息
    shopService.getFirstNotice().then(data => {
      this.setData({ notice: data });
    });

    //请求分类信息
    goodsService.categories().then(data => {
      console.info('请求分类成功');
      this.setData({ tab: data });
      //生成分页对象
      this.page = goodsService.page();
      //请求加载商品
      this.loadNextPage();
    });

    //请求优惠券信息
    couponService.shelf().then(data => this.setData({ coupons: data }));
  },

  /**
    * 加载下一页
    */
  loadNextPage: function () {
    const param = {
      category_id: this.data.tab.selectedId
    }
    this.page.next(param).then(data => {
      this.setData({ goods: data.list }
      );
    });
  },

  /**
   * 点击商品
   */
  onGoodsItemTap: function (event) {
    const goodsId = event.currentTarget.dataset.goodsId;
    Router.goodsIndex(goodsId);
  },

  /**
   * 点击店铺
   */
  onShopItemTap: function (event) {
    Router.shopDetail();
  },

  /**
   * 上划加载
   */
  onReachBottom: function (event) {
    this.loadNextPage();
  },

  /**
  * 下拉刷新
  */
  onPullDownRefresh: function () {
    this.reload();
    wx.stopPullDownRefresh();
  },


  /**
   * 重新加载
   */
  reload: function () {
    this.page.reset();
    this.loadNextPage();
  },

  /**
   * 点击领取卡券
   */
  onCouponTap: function (event) {
    const couponId = event.currentTarget.dataset.couponId;
    Tips.loading();
    couponService.pick(couponId).then(data => {
      Tips.toast('领取成功！');
    });
  },


  /**
   * 处理点击事件
   */
  handleZanTabChange(e) {
    var componentId = e.componentId;
    var selectedId = e.selectedId;

    this.setData({
      [`${componentId}.selectedId`]: selectedId
    });
    this.reload();
  }


}));