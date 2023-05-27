import { Prefab } from 'cc';
import { TextAsset } from 'cc';
import { _decorator, assetManager, Component, Node, AssetManager, Asset } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private excelBundle: AssetManager.Bundle = null;
    private fruitPrefabBundle: AssetManager.Bundle = null;

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
        console.log(this.excelBundle.get('fragment'));
        console.log(this.fruitPrefabBundle.get('apple'));
    }

    start() {
        this.preloadBundle();
    }

    update(deltaTime: number) {}
}
