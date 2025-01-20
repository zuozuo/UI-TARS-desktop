import { ElectronHandler } from '../../preload/index';

interface Window {
  electron: ElectronHandler;
  platform: NodeJS.Platform;
  zutron: any;
}
