'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">nest--intro documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' : 'data-bs-target="#xs-controllers-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' :
                                            'id="xs-controllers-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' : 'data-bs-target="#xs-injectables-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' :
                                        'id="xs-injectables-links-module-AppModule-d4ac6ff349e46e7a0fa544049380b41405040d5750fb5cfdbf838c1e6aef392cae67ae1c69f73333bd7da7db8676dc6c8d980958b23f2decafd719053ca88c5a"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' :
                                            'id="xs-controllers-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' :
                                        'id="xs-injectables-links-module-AuthModule-0a4ff4313cd871432d95ebe60748a105a58fc43fece089e155f6078d9558a7bf6a59c86314596b8d8cd9636dafe302b325b3b16aabbc9443f5c9f01167dfb134"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PostModule.html" data-type="entity-link" >PostModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' : 'data-bs-target="#xs-controllers-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' :
                                            'id="xs-controllers-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' }>
                                            <li class="link">
                                                <a href="controllers/PostsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PostsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' : 'data-bs-target="#xs-injectables-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' :
                                        'id="xs-injectables-links-module-PostModule-ac90b1b497b43d899785ae8ff6d42abd68f716a00435cf3b8ebb79846a1de6e277e80bf4603ccebdc4da4457b3e8ede31b9a4bf8e6788cfa77a57bf6f707749f"' }>
                                        <li class="link">
                                            <a href="injectables/PostsServices.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PostsServices</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TemplatePlaygroundModule.html" data-type="entity-link" >TemplatePlaygroundModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                            'id="xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <li class="link">
                                                <a href="components/TemplatePlaygroundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplatePlaygroundComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                        'id="xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <li class="link">
                                            <a href="injectables/HbsRenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HbsRenderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemplateEditorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplateEditorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ZipExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZipExportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' : 'data-bs-target="#xs-controllers-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' :
                                            'id="xs-controllers-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' : 'data-bs-target="#xs-injectables-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' :
                                        'id="xs-injectables-links-module-UsersModule-f57693c88a767f07404a341e8b73af1abe1d9182c5f351d2e6dfa637b9fee0efc70319d022a854ec93b5e1f32cfafa3368291d44198f274a9d7424a04245e786"' }>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AppController.html" data-type="entity-link" >AppController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AuthController.html" data-type="entity-link" >AuthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/PostsController.html" data-type="entity-link" >PostsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UsersController.html" data-type="entity-link" >UsersController</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/CreatPostDto.html" data-type="entity-link" >CreatPostDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatPostMetaOptionDto.html" data-type="entity-link" >CreatPostMetaOptionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatUserDto.html" data-type="entity-link" >CreatUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetUserParamDto.html" data-type="entity-link" >GetUserParamDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchPostDto.html" data-type="entity-link" >PatchPostDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchUserDto.html" data-type="entity-link" >PatchUserDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HbsRenderService.html" data-type="entity-link" >HbsRenderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PostsServices.html" data-type="entity-link" >PostsServices</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateEditorService.html" data-type="entity-link" >TemplateEditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZipExportService.html" data-type="entity-link" >ZipExportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/CompoDocConfig.html" data-type="entity-link" >CompoDocConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Template.html" data-type="entity-link" >Template</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});