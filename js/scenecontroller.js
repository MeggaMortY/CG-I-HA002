var SceneController = function(document)
{
    // world space
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xffffff );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );

    // clip space
    this.clipScene= new THREE.Scene();
    this.clipScene.background = new THREE.Color( 0xf0f0f0 );
    this.clipRenderer = new THREE.WebGLRenderer( { antialias: true } );

    // screen space
    this.screenScene = new THREE.Scene();
    this.screenScene.background = new THREE.Color( 0xffffff );
    this.screenRenderer = new THREE.WebGLRenderer( { antialias: true } );

    this.stats = new Stats();

    this.gui = new dat.GUI();
};

SceneController.prototype.setup = function()
{
    // https://threejs.org/docs/#api/renderers/WebGLRenderer
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth / 3 - 5, window.innerHeight -20);
    document.body.appendChild( this.renderer.domElement );
    this.renderer.autoClear = false;

    this.clipRenderer.setPixelRatio( window.devicePixelRatio );
    this.clipRenderer.setSize( window.innerWidth / 3 - 5, window.innerHeight - 20);
    document.body.appendChild( this.clipRenderer.domElement );
    this.clipRenderer.localClippingEnabled = true;

    this.screenRenderer.setPixelRatio( window.devicePixelRatio );
    this.screenRenderer.setSize( window.innerWidth / 3 - 5, window.innerHeight - 20);
    document.body.appendChild( this.screenRenderer.domElement );

    //add performance logging
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.setupGUI();
    this.setupCamera();
    this.setupControls();
    this.setupLight();
    this.setupGeometry();
    this.adjustCamera();
    this.animate();
};

var FizzyText = function() {
    this.maxSize = 6.4;
};

SceneController.prototype.setupGUI = function()
{
    this.otherParams = {
        clipAxes: false,
        sceneAxes: false,
        enableSceneOrbit: true,
        enableClipOrbit: true,
    };

    this.modelParams = {
        transx: 0,
        transy: 0,
        transz: 0,
        rotx: 0,
        roty: 0,
        rotz: 0,
        scale: 1
    };

    this.cameraParams = {
        near: 5,
        far: 30,
        fov: 70,
        aspectRatio: window.innerWidth / window.innerHeight / 3,
        atX: 0,
        atY: 0,
        atZ: 0,
        eyeX: 0,
        eyeY: 0,
        eyeZ: 25.0,
        upX: 0,
        upY: 1,
        upZ: 0
    };

    var modelGui = this.gui.addFolder('model manipulation');
    modelGui.add( this.modelParams, "transx", -20.0, 20.0 ).name("X translation");
    modelGui.add( this.modelParams, "transy", -20.0, 20.0 ).name("Y translation");
    modelGui.add( this.modelParams, "transz", -20.0, 20.0 ).name("Z translation");
    modelGui.add( this.modelParams, "rotx", 0, 360.0 ).name("X rotation");
    modelGui.add( this.modelParams, "roty", 0, 360.0 ).name("Y rotation");
    modelGui.add( this.modelParams, "rotz", 0, 360.0 ).name("Z rotation");
    modelGui.add( this.modelParams, "scale", 0.1, 2.0 ).name("Scale");

    var cameraGui = this.gui.addFolder('camera');
    this.fovValue = cameraGui.add(this.cameraParams,'fov',1,179).step(1);
    this.aspectRatioValue = cameraGui.add(this.cameraParams,'aspectRatio',0.1,10);
    this.nearValue = cameraGui.add(this.cameraParams,'near',0.01,50);
    this.farValue = cameraGui.add(this.cameraParams,'far',0.01,50);
    this.atXValue = cameraGui.add(this.cameraParams,'atX',-10,10);
    this.atYValue = cameraGui.add(this.cameraParams,'atY',-10,10);
    this.atZValue = cameraGui.add(this.cameraParams,'atZ',-10,10);
    this.eyeXValue = cameraGui.add(this.cameraParams,'eyeX',-10,10);
    this.eyeYValue = cameraGui.add(this.cameraParams,'eyeY',-10,10);
    this.eyeZValue = cameraGui.add(this.cameraParams,'eyeZ',-30,30);
    this.upXValue = cameraGui.add(this.cameraParams,'upX',-10,10);
    this.upYValue = cameraGui.add(this.cameraParams,'upY',-10,10);
    this.upZValue = cameraGui.add(this.cameraParams,'upZ',-10,10);

    // this.controller = this.gui.add(text, 'maxSize', 0, 10);

    this.gui.add( this.otherParams, "sceneAxes" ).name("World axes");
    this.gui.add( this.otherParams, "clipAxes" ).name("Clipping axes");
    this.gui.add( this.otherParams, "enableSceneOrbit" ).name("Scene orbit control");

    this.at = new THREE.Vector3();
    this.eye = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.gui.open()
};

SceneController.prototype.setCameraView = function() {
    this.at.set( this.cameraParams.atX, this.cameraParams.atY, this.cameraParams.atZ );
    this.eye.set( this.cameraParams.eyeX, this.cameraParams.eyeY, this.cameraParams.eyeZ );
    this.up.set( this.cameraParams.upX, this.cameraParams.upY, this.cameraParams.upZ );
};

SceneController.prototype.setupCamera = function()
{
    var fov    = this.cameraParams.fov || 70;  // in degrees
    var aspect = this.cameraParams.aspectRatio || (window.innerWidth / window.innerHeight / 3);  // canvas width/height
    var near   = this.cameraParams.near ||  5;  // measured from eye
    var far    = this.cameraParams.far  || 30;  // measured from eye

    // viewing camera
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1 * near, 100 * far);
    this.camera.position.z = 60;
    // this.camera.position.x = 20;
    this.leftCamera = new THREE.PerspectiveCamera(fov, aspect, 0.1 * near, 100 * far);
    this.leftCamera.position.z = 50;

    this.perspectiveCamera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    this.setCameraView();
    this.perspectiveCamera.position.copy(this.eye);
    // // Cameras inherit an "up" vector from Object3D.
    this.perspectiveCamera.up.copy(this.up);
    this.perspectiveCamera.lookAt(this.at);

    this.perspectiveCameraHelper = new THREE.CameraHelper(this.perspectiveCamera);
    this.perspectiveCameraHelper.matrixAutoUpdate = true;
    this.scene.add(this.perspectiveCameraHelper);

    this.screenScene.add(this.perspectiveCamera);

    var frustumSize = 3;
    this.clipCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / - 2, near, far);
    this.clipCamera.position.x = - 3;
    this.clipCamera.position.y = 3;
    this.clipCamera.position.z = 10;
    this.clipCamera.lookAt(this.clipScene.position);
    this.clipScene.add(this.clipCamera);
};

SceneController.prototype.setupControls = function()
{
    this.controls = new THREE.OrbitControls( this.leftCamera );
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.enableKeys = false;
    //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    this.controls.addEventListener( 'change', this.render.bind(this) );

};

SceneController.prototype.setupGeometry = function()
{
    this.params = {
        wireframe: false,
        sphereDetail: 10,
        cylinderDetail: 10,
        nose: true,
        noseRadius: 0.5,
        noseRotation: degToRad(10),
        ears: true,
        earRadius: 0.6,
        earScale: 0.5,
        earAngle: Math.PI/4,
        eyes: true,
        eyeRadius: 0.3,
        eyeAngleX: -Math.PI/6,
        eyeAngleY: +Math.PI/6,
        arms: true,
        armLength: 7,
        armRadiusTop: 1.5,
        armRadiusBottom: 1.2,
        legs: true,
        legRadiusTop: 1.8,
        legRadiusBottom: 1.4,
        legLength: 9,
        legRotationX: -degToRad(60),
        legRotationZ: degToRad(20),
        hipWidth: 2.5,
        hipHeight: -7,
        head: true,
        headRadius: 2,
        bodyRadius: 5,
        bodyScaleY: 2,
        noop: "last param"
    };

    this.axes = buildAxes(15);
    this.axes.position.set(0, 0, 0);
    this.scene.add(this.axes);

    this.clipAxes = buildAxes(15, left_hand=true);
    this.clipAxes.position.set(0, 0, -1);
    this.clipScene.add(this.clipAxes);

    this.bear = createTeddyBear(this.params);
    this.scene.add(this.bear);

    // Box
    var geometry = new THREE.CubeGeometry( 2, 2, 2);
    var geo = new THREE.EdgesGeometry( geometry );
    var cubeMat = new THREE.LineBasicMaterial( { color: 0xff8010, linewidth: 2} );
    var wireframe = new THREE.LineSegments( geo, cubeMat);
    this.clipScene.add( wireframe );

    this.bear3 = createTeddyBear(this.params);
    this.screenScene.add(this.bear3);
};

SceneController.prototype.setupLight = function()
{
    // https://threejs.org/docs/#api/lights/PointLight
    var light = new THREE.PointLight( 0xffffcc, 1, 100 );
    light.position.set( 10, 30, 15 );
    this.scene.add(light);

    var light2 = new THREE.PointLight( 0xffffcc, 1, 100 );
    light2.position.set( 10, -30, -15 );
    this.scene.add(light2);

    this.scene.add( new THREE.AmbientLight(0x999999) );
};


SceneController.prototype.adjustCamera = function()
{
    const self = this;

    this.fovValue.onChange(function(value) {
        self.perspectiveCamera.fov = value;
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCameraHelper.update();
        self.camera.fov = value;
        self.camera.updateProjectionMatrix();
        self.camera.lookAt(self.at);
    });

    this.atXValue.onChange(function(value){
        self.at.x = value;
        self.perspectiveCamera.lookAt(self.at);
        self.camera.lookAt(self.at);
    });

    this.atYValue.onChange(function(value){
        self.at.y = value;
        self.perspectiveCamera.lookAt(self.at);
        self.camera.lookAt(self.at);
    });

    this.atZValue.onChange(function(value){
        self.at.z = value;
        self.perspectiveCamera.lookAt(self.at);
        self.camera.lookAt(self.at);
    });

    this.eyeXValue.onChange(function(value){
        self.eye.x = value;
        self.perspectiveCamera.position.copy(self.eye);
        self.perspectiveCamera.lookAt(self.at);
        self.camera.position.x = value;
        self.camera.lookAt(self.at);
    });

    this.eyeYValue.onChange(function(value){
        self.eye.y = value;
        self.perspectiveCamera.position.copy(self.eye);
        self.perspectiveCamera.lookAt(self.at);
        self.camera.position.y = value;
        self.camera.lookAt(self.at);
    });

    this.eyeZValue.onChange(function(value){
        self.eye.z = value;
        self.perspectiveCamera.position.copy(self.eye);
        self.perspectiveCamera.lookAt(self.at);
        self.camera.position.z = value;
        self.camera.lookAt(self.at);
    });

    this.upXValue.onChange(function(value){
        self.up.x = value;
        self.perspectiveCamera.up.copy(self.up);
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCamera.lookAt(self.at);
        self.camera.up.copy(self.up);
        self.camera.updateProjectionMatrix();
        self.camera.lookAt(self.at);
    });

    this.upYValue.onChange(function(value){
        self.up.y = value;
        self.perspectiveCamera.up.copy(self.up);
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCamera.lookAt(self.at);
        self.camera.up.copy(self.up);
        self.camera.updateProjectionMatrix();
        self.camera.lookAt(self.at);
    });

    this.upZValue.onChange(function(value){
        self.up.z = value;
        self.perspectiveCamera.up.copy(self.up);
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCamera.lookAt(self.at);
        self.camera.up.copy(self.up);
        self.camera.updateProjectionMatrix();
        self.camera.lookAt(self.at);
    });

    this.nearValue.onChange(function(value){
        self.perspectiveCamera.near = value;
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCameraHelper.update();
        self.camera.near = value;
        self.camera.updateProjectionMatrix();
    });

    this.farValue.onChange(function(value){
        self.perspectiveCamera.far = value;
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCameraHelper.update();
        self.camera.far = value;
        self.camera.updateProjectionMatrix();
    });

    this.aspectRatioValue.onChange(function(value){
        self.perspectiveCamera.aspect = value;
        self.perspectiveCamera.updateProjectionMatrix();
        self.perspectiveCameraHelper.update();
        self.camera.aspect = value;
        self.camera.updateProjectionMatrix();
    });
    
    console.log(this.perspectiveCamera);
    console.log(this.camera);
};

SceneController.prototype.adjustModel = function()
{
};

SceneController.prototype.adjustClipView = function()
{
};

SceneController.prototype.render = function()
{
    this.axes.visible = this.otherParams.sceneAxes;
    this.renderer.render( this.scene, this.leftCamera);

    this.clipAxes.visible = this.otherParams.clipAxes;
    this.clipRenderer.render(this.clipScene, this.clipCamera);

    this.screenRenderer.render( this.screenScene, this.camera);

    this.stats.update();
};

SceneController.prototype.animate = function()
{
    //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    requestAnimationFrame( this.animate.bind(this) );
    this.stats.update();

    this.controls.enabled = this.otherParams.enableSceneOrbit;
    this.controls.update();
    this.render()
};