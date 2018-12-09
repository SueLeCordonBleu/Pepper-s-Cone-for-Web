/*
Pepper's Cone for Web _V1
Intro to Computitional Media Final Project
By: Chunhan Chen
Date: 2018-12-09

Adapted from: 
Original Pepper’s Cone project by Xuan Luo:
http://roxanneluo.github.io/PeppersCone.html
Copyright 2018 University of Washington
@inproceedings{luo2017pepper,
  title={Pepper's Cone: An Inexpensive Do-It-Yourself 3D Display},
  author={Luo, Xuan and Lawrence, Jason and Seitz, Steven M},
  booktitle={Proceedings of the 30th Annual ACM Symposium on User Interface Software and Technology},
  pages={623--633},
  year={2017},
  organization={ACM}
}

Note: This project has to be run on a localhost due to CORS issues.
*/
var scene, camera, renderer, container;
var bufferScene, bufferTarget,bufferTexture, bufferCamera;

window.addEventListener('load', init, false);

var fieldOfView, aspectRatio, nearPlane, farPlane;
var cube,line;
var deer, deerMaterial;

function init() {
   createScene();  //create the scene, camera and renderer
   createBufferScene(); //create the bufferScene, bufferCamera and bufferRenderer
   createLights();  //create Lights
   loadModel();  //loadModel with GLTFLoader
   loadMapTexture();
   loop();
}

function createScene() {
    scene = new THREE.Scene(); // create a new instance of the scene      

    /* create a prospective camera:
        aspectRatio = window.innerWidth / window.innerHeight;
        fieldOfView = 60;
        nearPlane = 1; 
        farPlane = 10000;
    */
    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,0.1,10000);
    camera.position.set(0, 0, 30); // set the postition of the camera
    camera.lookAt( 0, 0, 0 ); //The direction of the camera!

    // create a renderer
    renderer = new THREE.WebGLRenderer({ 
        alpha: true,  // set the background of the renderer to transparent
        antialias: true  
    }); 
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.setSize(window.innerWidth, window.innerHeight); 

    // 打开渲染器的阴影地图
    //renderer.shadowMap.enabled = true; 

    container = document.getElementById('canvas');   
    container.appendChild(renderer.domElement); //attach the renderer as the child of the canvas in html.

    //creating a callback function to resize automatically
    window.addEventListener('resize', whenWindowResize, false);
}

function createBufferScene(){
    bufferScene = new THREE.Scene();
    bufferTarget = new THREE.WebGLRenderTarget( 
        window.innerWidth, window.innerHeight, 
        {minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter});
    bufferTexture = bufferTarget.texture;   

    bufferCamera = new THREE.PerspectiveCamera(60,
        window.innerWidth / window.innerHeight,0.1,10000);
    bufferCamera.position.set(-1, 4, 20); // set the postition of the camera
    bufferCamera.lookAt( 0, 0, -80 ); //The direction of the camera!
}

function whenWindowResize() {        
   renderer.setSize(window.innerWidth, window.innerHeight); 
   camera.aspect = window.innerWidth/window.innerHeight;
   camera.updateProjectionMatrix();
   bufferCamera.aspect = window.innerWidth/window.innerHeight;
   bufferCamera.updateProjectionMatrix();
}


var hemisphereLight, shadowLight;
function createLights() {
   hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);
   shadowLight = new THREE.DirectionalLight(0xffffff, .9);
   shadowLight.position.set(150, 350, 350);
   shadowLight.castShadow = true;
   shadowLight.shadow.camera.left = -400;
   shadowLight.shadow.camera.right = 400;
   shadowLight.shadow.camera.top = 400;
   shadowLight.shadow.camera.bottom = -400;
   shadowLight.shadow.camera.near = 1;
   shadowLight.shadow.camera.far = 1000;
   shadowLight.shadow.mapSize.width = 2048;
   shadowLight.shadow.mapSize.height = 2048;

   scene.add(hemisphereLight);
   scene.add(shadowLight);

   bufferScene.add(hemisphereLight);  
   bufferScene.add(shadowLight);
}

/***************
    using "render to texture" to store the scene before drawing it to the screen
    https://gamedevelopment.tutsplus.com/tutorials/quick-tip-how-to-render-to-a-texture-in-threejs--cms-25686
*/

//******************************** */
//shader & material 
var decodedMap;
var wrapMono;
var encodedMap;

function loadMapTexture(){

var texLoader = new THREE.ImageLoader();
texLoader.load(
	'textures/IpadProDistortionCalibrationMap.png',

	// onLoad callback
	function ( texture ) {
        console.log('finished map texture loading!');
        encodedMap = texture;
        console.log(encodedMap);
        createCube();   //create object
        createWrap();
	},
    undefined,
	function ( err ) {
		console.error( 'An error happened.' );
	}
);
}


function createWrap(){
    var TexRotationTest = new THREE.Vector4(0.0, 0.0, 0.0, 0.0);
    var uniforms = {
        _TexRotationVec: {
            type: 'v4',
            value: TexRotationTest},
        _power: {
            type: 'f',
            value: 1.0},
        _alpha: {
            type: 'f',
            value: 1.0},
        RenderedTex:{
            type: 't',
            value: bufferTexture},//Similar function as the Rendered},
        MapTex:{
            type: 't',
            value: decodedMap}//modelTexture}
        };
    wrapMono = new wrapBase(4095,true,1,1,uniforms);
    console.log("start to wrap!");
    decodedMap = wrapMono.convertRGBATexture2Map(encodedMap);
    wrapMono.material.uniforms.MapTex.value = decodedMap;
    var displayGeo = new THREE.PlaneGeometry(40,30);//window.innerWidth,window.innerHeight);
    var iPadDisplayPlane = new THREE.Mesh(displayGeo, wrapMono.material);
    iPadDisplayPlane.rotateOnAxis ( new THREE.Vector3(0,0,1), 3.14);
    scene.add(iPadDisplayPlane);
    iPadDisplayPlane.position.set(0,0,0);

// /*Data texture for testing*/
// var data = new Uint8Array(decodedMap.image.data.length);
// console.log(decodedMap.image.data);
// for (var i = 0; i < decodedMap.image.data.length; i++) {
    
//     data[i] = decodedMap.image.data[i]*255;
//     if(i%4==3){
//         data[i]=100;
//     }
//     //data[i] = Math.random()*256; // generates random r,g,b,a values from 0 to 1
// }
//     console.log(data);
//     var dataTex = new THREE.DataTexture(data, decodedMap.image.width, decodedMap.image.height, THREE.RGBAFormat, undefined, undefined, THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,THREE.LinearFilter,THREE.LinearFilter,1);
//     dataTex.magFilter = THREE.LinearFilter; // also check out THREE.LinearFilter just to see the results
//     dataTex.needsUpdate = true; // somehow this line is required for this demo to work. I have not figured that out yet. 



    /*Plane for testing decoded results */
//     var planeGeo = new THREE.PlaneBufferGeometry(40,30);
//    // var planeMat = new THREE.MeshBasicMaterial({ map: bufferTexture});
//     var planeMat = new THREE.MeshBasicMaterial({ map: dataTex });
//     //var planeMat = new THREE.MeshBasicMaterial({ map: encodedTex });
//     var plane = new THREE.Mesh(planeGeo, planeMat);
//     //scene.add(plane); // hiding the plane
}


function createCube(){
    var geometry = new THREE.BoxGeometry( 1.5, 1.5,1.5);
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    cube = new THREE.Mesh(geometry, material);
    bufferScene.add(cube);
}



function loadModel(){
    //GLTF model loader
    var modelLoader = new THREE.GLTFLoader();
    modelLoader.load('model/antelope_poly_gltf/scene.gltf', modelReady, undefined, modelFault);


    function modelReady(gltf){
        deer = gltf.scene;
        bufferScene.add(deer);
        deer.scale.x = 3;
        deer.scale.y = 3;
        deer.scale.z = 3;
        deer.position.set(0,0,2)
    }
    function modelFault(error){
        console.error( error );
    }
}

function loop(){
    requestAnimationFrame(loop); //refresh 60 times per second. 
    if(cube){
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    }
    if(deer){
       deer.rotation.y += 0.01;
    }
    renderer.render(bufferScene, bufferCamera, bufferTarget);
    if(wrapMono){
        wrapMono.lateUpdate();
    }
    renderer.render(scene, camera); // render the scene with the camera
}