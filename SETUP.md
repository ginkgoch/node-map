# Setup Development Env
In this page, I will introduce how to install the dependencies and set the dev env up. 

## Install Cario
> `This is not required for desktop application` - If you are going to build a desktop application, please ignore this section.

`Ginkgoch MAP` is a cross-platform GIS development library. For desktop, we could take the advantage of `electron` and HTML5 APIs for rendering graphics. While for services, or command tools, due to the lack of graphics support by Node.JS, I chose [canvas](https://www.npmjs.com/package/canvas) as my graphics module. `Canvas` module uses `cario` which is required dependency for `Ginkgoch MAP` library. Refer to [the official document](https://github.com/Automattic/node-canvas) to prepare the env. 

Here is also a snapshot for the reference.
| OS      | Command                                                      |
| ------- | ------------------------------------------------------------ |
| macOS   | brew install pkg-config cairo libpng jpeg giflib             |
| Ubuntu  | sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++ |
| Fedora  | sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel |
| Solaris | pkgin install cairo pkg-config xproto renderproto kbproto xextproto |
| Windows | [refer the wiki for instruction](https://github.com/Automattic/node-canvas/wiki/Installation---Windows) |

## Install ginkgoch-map

### Desktop
`Electron` and `NW.js` is a framework for building desktop application with JavaScript. `Ginkgoch MAP` is compatible with them. Follow the following steps to kickstart your desktop application development.

1. Two projects that could startup your desktop project. Choose either one for your project baseline.
    * [Electron quick start from vanilla JavaScript](https://github.com/ginkgoch/electron-quick-start)
    * [Electron quick start from TypeScript](https://github.com/ginkgoch/electron-quick-start-typescript)

    After it is cloned, run:
    ```bash
    npm i
    ```
2. Install `ginkgoch-map`.
    ```bash
    npm i ginkgoch-map --save
    ```
3. Inject `HTML5` canvas as native graphic API
    ```javascript
    require('ginkgoch-map/native/dom').init();
    ```

### Services & Command Line Tools
1. Install dependencies
    `ginkgoch-node` and `canvas` are required. _Make sure the `cario` is pre installed on your dev machine or deployment host_.
    ```bash
    npm i canvas ginkgoch-node --save
    ```
2. Inject `canvas` as native graphic API
    ```javascript
    require('ginkgoch-map/native/node').init();
    ```

At this step, your development env is ready. The next step is to build your fantastic applications. Here are [some feature demos](https://github.com/ginkgoch/map-quick-started-demos) to follow up.

Happy Mapping!