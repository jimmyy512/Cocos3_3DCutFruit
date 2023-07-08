import { Prefab, instantiate, v3 } from 'cc';
import { TextAsset } from 'cc';
import { _decorator, assetManager, Component, Node, AssetManager, Asset } from 'cc';
import { ExcelMgr } from './ExcelMgr';
import { Fruit, FruitData } from './Fruit';
import { FragmentData } from './Type/FragmentData';

const { ccclass, property } = _decorator;

enum GameState {
    Ready,
    Running,
    Checkout,
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Node })
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
    private readonly SPAWN_LINE: number = -10;

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

    // 預加載資源 Bundle 的函數
    private async preloadBundle(): Promise<void> {
        try {
            // 載入 Excel 資料和水果模型 Bundle
            this.excelBundle = await this.loadBundle('Datas');
            this.fruitPrefabBundle = await this.loadBundle('FruitModels');

            // 載入 Excel 資料和水果模型
            await this.loadDir(this.excelBundle, './', TextAsset);
            await this.loadDir(this.fruitPrefabBundle, './', Prefab);

            // 開始遊戲
            this.startGame();
        } catch (error) {
            console.error('Failed to load bundles or directories.', error);
        }
    }

    /**
     * 遊戲開始函數，初始化 ExcelMgr，載入碎片和水果資料，並重置遊戲狀態
     */
    private startGame(): void {
        (window as any).test = this;

        // 將 Excel 資料加入 ExcelMgr
        ExcelMgr.Instance.addTable('fruit', (this.excelBundle.get('fruit') as TextAsset).text);
        ExcelMgr.Instance.addTable(
            'fragment',
            (this.excelBundle.get('fragment') as TextAsset).text
        );

        // 取得所有碎片和水果資料
        this.allFragments = ExcelMgr.Instance.getTableArr('fragment');
        this.allFruits = ExcelMgr.Instance.getTableArr('fruit');

        // 重置遊戲狀態
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

    /**
     * 根據給定的碎片配置生成水果節點
     * @param fragmentConfig 碎片配置
     */
    private generateFruitNodeByFragConfig(fragmentConfig: FragmentData): void {
        let fruitID = fragmentConfig.fruitId;
        let newFruitData: FruitData = null;

        // 如果水果ID為-1，則生成隨機水果
        if (fruitID === '-1') {
            let randomIndex = Math.floor(Math.random() * this.allFruits.length);
            newFruitData = this.allFruits[randomIndex];
        } else {
            // 否則，生成指定的水果
            newFruitData = ExcelMgr.Instance.queryByID('fruit', fruitID);
        }

        console.warn('newFruitData:', newFruitData);

        // 實例化水果預製體並將其添加到根節點
        const fruitPrefab: Prefab = this.fruitPrefabBundle.get(newFruitData.prefab);
        const fruitNode = instantiate(fruitPrefab);
        this.rootNode.addChild(fruitNode);

        // 根據碎片配置設置水果的位置
        const percent = parseFloat(fragmentConfig.positionX) / 1280;
        const totalLen = 18;
        const fruitX = -totalLen * 0.5 + totalLen * percent;
        fruitNode.setPosition(v3(fruitX, this.SPAWN_LINE, -10));

        // 將Fruit組件添加到水果節點並使用新的水果數據進行初始化
        fruitNode.addComponent(Fruit).init(newFruitData, fragmentConfig);
    }

    /**
     * 生成一個水果
     */
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

    /**
     * 生成水果的處理函數
     * @param dt 經過的時間
     */
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
