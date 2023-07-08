import { _decorator, Component, Node, v3, Vec3 } from 'cc';
import { FragmentData } from './Type/FragmentData';
const { ccclass, property } = _decorator;

export type FruitData = {
    ID: string;
    color: string;
    name: string;
    particleScale: string;
    prefab: string;
    scale: string;
    trailPath: string;
    trailScale: string;
    type: string;
};

enum FruitState {
    Ready,
    Running,
    Sliced,
    Dead,
}
@ccclass('Fruit')
export class Fruit extends Component {
    private fruitData: FruitData = null;
    private initScale: number = 0;
    private deadLine: number = -11;
    private fruitState: FruitState = FruitState.Ready;
    private vx: number = 0;
    private vy: number = 0;
    private wSpeed: number = 90;
    private readonly GRAVITY: number = -10;
    start() {}

    /**
     * 初始化水果
     * @param fruitData 水果資料
     * @param fragmentData 碎片資料
     */
    init(fruitData: FruitData, fragmentData: FragmentData) {
        this.fruitData = fruitData;
        this.initScale = this.node.scale.x;

        // 設定水果的縮放比例
        const newScale = this.initScale * parseFloat(fruitData.scale);
        this.node.setScale(v3(newScale, newScale, newScale));

        // 設定水果的初始速度
        const fx = parseFloat(fragmentData.forceX);
        const fy = parseFloat(fragmentData.forceY);
        this.throwFruitOut(v3(fx, fy, 0));
    }

    /**
     * 將水果從初始位置拋出
     * @param force 拋出的力量
     */
    public throwFruitOut(force: Vec3): void {
        if (this.fruitState !== FruitState.Ready) {
            return;
        }

        // 設定水果的速度
        this.vx = force.x * 0.1;
        this.vy = force.y * 0.1;
        this.fruitState = FruitState.Running;
    }

    /**
     * 更新水果的位置和旋轉角度
     * @param dt 時間差
     */
    fruitTotalUpdate(dt: number): void {
        let pos = this.node.getPosition();
        pos.x += this.vx * dt;
        pos.y += this.vy * dt + this.GRAVITY * dt * dt * 0.5;
        this.vy += this.GRAVITY * dt;
        this.node.setPosition(pos);

        // 水果旋轉
        const degree = this.wSpeed * dt;
        const rot: Vec3 = this.node.eulerAngles;
        rot.z += degree;
        this.node.setRotationFromEuler(rot);

        // 如果水果掉落到一定高度以下，就刪除水果
        if (pos.y <= this.deadLine) {
            console.warn('remove fruit');
            this.fruitState = FruitState.Dead;
            this.node.destroy();
        }
    }

    update(deltaTime: number) {
        if (this.fruitState === FruitState.Running) {
            this.fruitTotalUpdate(deltaTime);
        }
    }
}
