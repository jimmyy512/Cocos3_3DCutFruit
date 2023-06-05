import { _decorator, Component, Node, v3 } from 'cc';
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

@ccclass('Fruit')
export class Fruit extends Component {
    private fruitData: FruitData = null;
    private initScale: number = 0;
    start() {}

    update(deltaTime: number) {}

    init(fruitData: FruitData) {
        this.fruitData = fruitData;
        this.initScale = this.node.scale.x;

        const newScale =this.initScale * parseFloat(fruitData.scale);
        this.node.setScale(v3(newScale,newScale,newScale));
    }
}
