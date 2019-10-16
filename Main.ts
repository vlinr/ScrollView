import GameConfig from "./GameConfig";
import ScrollView from "./ScrollView";
class Main {
	constructor() {
		console.log('%chttp://www.this1.cn/ | Email:zlife@vip.qq.com | Keen | HTML5', 'font-size:14px;background: linear-gradient(to right, red, blue); -webkit-background-clip: text;color: transparent;');
		//根据IDE设置初始化引擎		
		if (window["Laya3D"]) Laya3D.init(GameConfig.width, GameConfig.height);
		else Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
		Laya["Physics"] && Laya["Physics"].enable();
		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
		Laya.stage.scaleMode = GameConfig.scaleMode;
		Laya.stage.screenMode = GameConfig.screenMode;
		//兼容微信不支持加载scene后缀场景
		Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
		if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true") Laya.enableDebugPanel();
		if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"]) Laya["PhysicsDebugDraw"].enable();
		if (GameConfig.stat) Laya.Stat.show();
		Laya.alertGlobalError = true;
		Laya.stage.bgColor='#fff';
		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
	}
	onVersionLoaded(): void {
		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
	}
	private scrollView: any;  //scrollView
	// 鼠标按下
	private mouseDownEvent: boolean = false;
	// 鼠标移动速度
	private mouseSpeed: number = 0;
	private mouseStartEventX: number = 0;  //鼠标开始位置
	private curMoveFrame: number = 0; 
	private itemMaxScale: number = 1;  //最大缩放比
	private itemMinScale: number = .6; //最小缩放比
	private startX:number=0;   //记录开始位置
	private mouseDownEventOpen:boolean=true;//是否开始点击
	private deviation:boolean=false;//是否偏离
	private mouseEventX: number = 0;
	onConfigLoaded(): void {
		//加载IDE指定的场景
		//使用ScrollView
		this.scrollView = new ScrollView();  //实例化列表
		Laya.stage.addChild(this.scrollView);
		//启动侦听器，自动回笼中间元素
		Laya.timer.frameLoop(1, this, this.onUpdate);
		//生成数据源
		var array = [];
		for (var i: number = 0; i < 10; ++i) {
			// array.push('zs.png');
			let sp:any=new Laya.Sprite();
			sp.loadImage('zs.png');
			sp.width=300;
			sp.height=300;
			if(i%2==0)sp.price='分享获得';
			else if(i%5==0)sp.price='看视频获得';
			else
			sp.price=1000;
			//此处传递的是一个对象
			array.push(sp);
		}
		this.btmBye(); //添加购买按钮
		this.scrollView.setArray = array;  //设置数据源//这里调用的是setter方法
		this.initScrollView();   //初始化信息
		this.scrollView.setRenderHandler = new Laya.Handler(this, this.onScrollRender);  
		this.scrollView.setMouseHandler = new Laya.Handler(this, this.onScrollMouse);
		this.centeringControl(2); //设置第三个居中
		this.updateScale(2); //设置第三个缩放
		this.updateRotate(2,60);  //设置第三个旋转
	}
	//设置自动居中效果
	private onUpdate() {
		if (!this.mouseDownEvent && this.mouseSpeed != 0) {
			var direction = Math.abs(this.mouseSpeed) / this.mouseSpeed;
			var absSpeed = Math.sqrt(Math.abs(this.mouseSpeed));
			var moveDis = this.mouseSpeed;
			this.updateScrollViewPos(moveDis);
			this.updateScale();
			absSpeed = absSpeed - 0.3;
			if (absSpeed < 1) {
				absSpeed = 0;
				this.mouseSpeed = 0;
				// 居中显示 
				this.centeringControl();
			} else {
				this.mouseSpeed = absSpeed * absSpeed * direction;
			}
		}
	}
	//渲染的时候更新，绑定点击事件
	private onScrollRender(cell: Laya.Box, index: number) {
		// console.log(cell,index)
		if(this.mouseDownEventOpen){
			cell.on(Laya.Event.CLICK,this,(e:Laya.Event)=>{
				if(!this.deviation){
					//鼠标是否在原位置
					console.log('CLICK ME！');
				}
			})
		}
	}
	//自定义滚动
	/**
	* ScrollView鼠标操作响应
	* @param e 
	*/
	private onScrollMouse(e: Event) {
		// 移动ScrollView时其中单元格缩放
		if (e.type == Laya.Event.MOUSE_DOWN) {
			this.mouseDown();
		} else if (e.type == Laya.Event.MOUSE_UP) {
			this.mouseUp();
		} else if (e.type == Laya.Event.MOUSE_MOVE) {
			this.mouseMove();
		}
	}
    /**
     * 鼠标按下响应事件
     */
	private mouseDown() {
		this.deviation=false;
		this.mouseDownEvent = true;
		this.mouseStartEventX = Laya.MouseManager.instance.mouseX;
		this.mouseEventX = Laya.MouseManager.instance.mouseX;
	}
    /**
     * 鼠标抬起响应事件
     */
	private mouseUp() {
		if (!this.mouseDownEvent) {
			return;
		}
		var stableFrame = Laya.timer.currFrame - this.curMoveFrame;
		// 滑动
		if (stableFrame > 2) {
			this.mouseSpeed = 0;
			this.centeringControl();
		}
		this.mouseDownEvent = false;
	}
    /**
     * 鼠标移动事件响应
     */
	private mouseMove() {
		if (this.mouseDownEvent) {
			this.deviation=true;
			var dis = Laya.MouseManager.instance.mouseX - this.mouseEventX;
			this.mouseEventX = Laya.MouseManager.instance.mouseX;
			this.updateScrollViewPos(dis);
			this.updateScale();
			this.curMoveFrame = Laya.timer.currFrame;
			this.mouseSpeed = dis;
		}
	}
	/**
	* 调整图像大小
	*/

	//设置旋转
	private updateRotate(index:number,angle:number) {
		this.scrollView.getItemByIndex(index).rotation=angle;
	}
	//更新缩放，设置元素缩放
	private updateScale(startNum:number=-1) {
		var centerIndex = startNum==-1?this.getScreenCenterCellIndex():startNum;
		var leftIndex = Math.max(centerIndex - 1, 0);
		var rightIndex = Math.min(centerIndex + 1, this.scrollView.array.length - 1);
		var scrollPosX = this.scrollView.x;
		var centerPos = Laya.stage.width / 2 - scrollPosX;
		for (var index = leftIndex; index <= rightIndex; index++) {
			let cellPos = this.scrollView.getCellPosByIndex(index);
			let cellDis = Math.abs(cellPos - centerPos);
			if (cellDis < 180) {
				let scaleRate = this.itemMaxScale - (this.itemMaxScale - this.itemMinScale) / 180 * cellDis;
				let item: Item = this.scrollView.getItemByIndex(index) as Item;
				item.alpha=1; //选中状态，中间元素
				item.scale(scaleRate, scaleRate);
				// console.log(item)
				this.setByeText(item._children[0].price);  //获取自定义属性
			} else {
				let item: Item = this.scrollView.getItemByIndex(index) as Item;
				item.graphics.clear();
				item.alpha=.2; //设置很透明
				item!=undefined && item!=null && Laya.Tween.to(item, { 
					scaleX:.4,
					scaleY:.4
				 }, 0, Laya.Ease.linearInOut);
			}
		}
	}
	//获取屏幕中间的单元格
	public getScreenCenterCellIndex(): number {
		var distance = -this.scrollView.x;
		var index: number = (distance - this.scrollView.spaceLeft + this.scrollView.space + (Laya.stage.width + this.scrollView.cellWidth) / 2) / (this.scrollView.cellWidth + this.scrollView.space);
		return Math.round(index) - 1;
	}
	/**
	* 将角色居中显示
	*	startNum:设置哪个角色居中，默认不设置
	*/
	private centeringControl(startNum:number=-1) {
		var centerIndex = startNum==-1?this.getScreenCenterCellIndex():startNum;
		var cellPosX = this.getCellPosByIndex(centerIndex);
		var posX = Laya.stage.width / 2 - cellPosX;
		if(startNum==-1)
			Laya.Tween.to(this.scrollView, { x: posX }, 500, Laya.Ease.cubicOut).update = new Laya.Handler(this, this.updateScale);
		else{
			this.scrollView.x=posX;
			this.startX=Laya.stage.width / 2 - this.getCellPosByIndex(0);
		}
	}
	/**
	* 根据单元格索引获取单元格位置
	* @param index 
	*/
	public getCellPosByIndex(index: number): number {
		return this.scrollView.spaceLeft + (index + 0.5) * this.scrollView.cellWidth + index * this.scrollView.space;
	}
	//初始化信息
	private initScrollView() {
		// this.scrollView.setSpaceLeft = 100;
		// this.scrollView.setSpaceRight = 100;
		this.scrollView.space = 50;  //设置左右间距
		this.scrollView.setCellWidth = 300;  //方块的宽高
		this.scrollView.setCellHeight = 300;
		this.scrollView.setItemRender = Item;  //渲染类
		this.scrollView.height = 300;  //view的高度
		this.scrollView.pos(0, 200); //位置
	}
	/**
	 * 设置元素滚动
	 * dis:距离
	 * ***/
	private updateScrollViewPos(dis: number) {
		var posX: number = dis + this.scrollView.x;
		if (posX > this.startX) {  //开始的位置 0位置，如果需要其他位置，自行调试
			posX = this.startX;
		}
		var posEnd:number = Laya.stage.width / 2 - this.getCellPosByIndex(this.scrollView.array.length-1);
		if (posX < posEnd) { //结束的位置
			posX = posEnd;
		}
		this.scrollView.pos(posX, this.scrollView.y);
	}
	private byeText:Laya.Text;
	//增加下方购买按钮
	private btmBye():void{
		let byeBtn:Laya.Sprite=new Laya.Sprite();
		byeBtn.loadImage('byebtn.png');
		byeBtn.width=233;
		byeBtn.height=122;
		byeBtn.pos((Laya.stage.width-byeBtn.getBounds().width)/2,(Laya.stage.height-byeBtn.getBounds().height)/2);

		this.byeText=new Laya.Text();
		this.byeText.width=byeBtn.getBounds().width;
		this.byeText.align='center';
		this.byeText.fontSize=40;
		this.byeText.color='#fff';
		this.byeText.text=``;
		this.byeText.pos(0,(122-40)/2);
		byeBtn.addChild(this.byeText);
		Laya.stage.addChild(byeBtn);
		byeBtn.on(Laya.Event.CLICK,this,(e:Laya.Event)=>{
			let target:any=e.target;
			console.log('购买价格',target.price);
		})
	}
	//更新内容
	private setByeText(str:any):void{
		this.byeText.text=`${str}`;
		Object.defineProperty(this.byeText.parent,'price',{
			writable:true,
			value:typeof str == 'number'? str:-1
		})
	}
}

class Item extends Laya.Box {
	private sprite:Laya.Sprite;
	constructor(w:number,h:number) {
		super();
		this.pivot(w/2,h/2);  //设置居中
		this.size(w, h);
	}
	public set setImage(url:string){
		this.sprite.loadImage(url);
	}
}
//激活启动类
new Main();
