import { Prefab, instantiate, v3 } from 'cc';
import { TextAsset } from 'cc';
import { _decorator, assetManager, Component, Node, AssetManager, Asset } from 'cc';
import { ExcelMgr } from './ExcelMgr';
import { Fruit, FruitData } from './Fruit';
const { ccclass, property } = _decorator;

type FragmentData = {
    ID: string;
    difficulty: string;
    forceX: string;
    forceY: string;
    fruitId: string;
    positionX: string;
    time: string;
};



enum GameState {
    Ready,
    Running,
    Checkout,
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property({type:Node})
    public rootNode: Node = null;

    private excelBundle: AssetManager.Bundle = null;
    private fruitPrefabBundle: AssetManager.Bundle = null;

    private difficulty: number = 1;
    private fragments: Array<FragmentData> = [];
    private fragIndex: number = 0;
    private allFragments: Array<FragmentData> = [];
    private allFruits: Array<FruitData> = [];

    private gameState: GameState = GameState.Ready;
    private passTime: number = 0;
    private nextTime: number = 0;

    start() {
        this.node.addComponent(ExcelMgr);
        this.preloadBundle();
    }

    update(deltaTime: number) {
        this.generateFruitHandle(deltaTime);
    }

    private async loadBundle(name: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(name, (err, bundle) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bundle);
                }
            });
        });
    }

    private async loadDir(
        bundle: AssetManager.Bundle,
        dir: string,
        assetType: typeof Asset
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            bundle.loadDir(dir, assetType, (err, assets) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private async preloadBundle(): Promise<void> {
        try {
            this.excelBundle = await this.loadBundle('Datas');
            this.fruitPrefabBundle = await this.loadBundle('FruitModels');
            await this.loadDir(this.excelBundle, './', TextAsset);
            await this.loadDir(this.fruitPrefabBundle, './', Prefab);
            this.startGame();
        } catch (error) {
            console.error('Failed to load bundles or directories.', error);
        }
    }

    private startGame(): void {
        (window as any).test = this;

        ExcelMgr.Instance.addTable('fruit', (this.excelBundle.get('fruit') as TextAsset).text);
        ExcelMgr.Instance.addTable(
            'fragment',
            (this.excelBundle.get('fragment') as TextAsset).text
        );

        this.allFragments = ExcelMgr.Instance.getTableArr('fragment');
        this.allFruits = ExcelMgr.Instance.getTableArr('fruit');
        this.gameState = GameState.Ready;
        this.resetGame();
    }

    private resetGame(): void {
        this.difficulty = 1;
        this.fragments = this.getFragmentByDifficult(this.difficulty);
        this.gameState = GameState.Running;
        this.fragIndex = 0;
        this.rootNode.removeAllChildren();
        this.generateOneFruit();
    }

    private getFragmentByDifficult(difficulty: number): FragmentData[] {
        return this.allFragments.filter((it) => it.difficulty === difficulty.toString());
    }

    private generateFruitNodeByFragConfig(fragConfig: FragmentData): void {
        let fruitID = fragConfig.fruitId;
        let newFruitData: FruitData = null;
        if (fruitID === '-1') {
            //隨機產生水果
            // ExcelMgr.Instance.
            let randomIndex = Math.floor(Math.random() * this.allFruits.length);
            newFruitData = this.allFruits[randomIndex];
        } else {
            // 產生指定水果
            newFruitData = ExcelMgr.Instance.queryByID('fruit', fruitID);
        }
        console.warn('newFruitData:', newFruitData);

        const fruitPrefab:Prefab = this.fruitPrefabBundle.get(newFruitData.prefab);
        const fruitNode = instantiate(fruitPrefab);
        this.rootNode.addChild(fruitNode);

        const percent =parseFloat(fragConfig.positionX)/1280;
        const totalLen = 18
        const fruitX= -totalLen *0.5+totalLen*percent;
        fruitNode.setPosition(v3(fruitX,0,-10));
        fruitNode.addComponent(Fruit).init(newFruitData);
        
    }

    private generateOneFruit(): void {
        const fragConfig = this.fragments[this.fragIndex];
        this.generateFruitNodeByFragConfig(fragConfig);

        this.passTime = 0;
        this.nextTime = parseFloat(fragConfig.time);

        this.fragIndex++;
        if (this.fragIndex >= this.fragments.length) {
            this.difficulty++;
            const nextDifficultConfigArray = this.getFragmentByDifficult(this.difficulty);
            if (nextDifficultConfigArray.length <= 0) {
                // 如果已經沒有新的難度關卡資料
                this.difficulty--;
            } else {
                // 更新下一個新的關卡資料
                this.fragments = nextDifficultConfigArray;
            }
            this.fragIndex = 0;
        }
    }

    private generateFruitHandle(dt: number) {
        if (this.gameState !== GameState.Running) {
            return;
        }
        this.passTime += dt;
        if (this.passTime >= this.nextTime) {
            this.generateOneFruit();
        }
    }
}
