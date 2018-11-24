// Teddy bear creation from Camera API Demo for CS307
// Author: Scott D. Anderson
// Date: August 28, 2014
// Based on an original demo by Nate Robbins.

function createNose(params) {
    var sd = params.sphereDetail || 10;
    var radius = params.noseRadius || 0.6;
    var noseGeometry = new THREE.SphereGeometry(radius,sd,sd);
    var color = params.noseColor || 0x000000;
    var mat = new THREE.MeshBasicMaterial({'color':color});
    var noseMesh = new THREE.Mesh(noseGeometry, mat);
    return noseMesh;
}

function addNose(head,params) {
    /* adds a nose to the head. It's placed by creating a composite object
     * centered in the middle of the head, and positioning the nose at the
     * head radius on +Z, then rotating around X by a little. */
    var noseframe = new THREE.Object3D();
    var nose = createNose(params);
    var radius = params.headRadius || 2;
    nose.position.z = radius; // within the noseframe
    noseframe.add(nose);
    var angle = params.noseRotation || degToRad(10);
    noseframe.rotation.x = angle;
    head.add(noseframe);
    return head;
}

function createEar(params) {
    // side is 1 (right) or -1 (left)
    var sd = params.sphereDetail || 10;
    var radius = params.earRadius || 0.6;
    var earGeometry = new THREE.SphereGeometry(radius,sd,sd);
    var color = params.earColor || 0x000000;
    var mat = new THREE.MeshBasicMaterial({color:color});
    var ear = new THREE.Mesh(earGeometry, mat);
    //Flattens the sphere to make it look more like a flat disk
    ear.scale.z = params.earScale || 0.5;
    return ear;
}

function addEar(head,params,side) {
    /* adds an ear to the head on the right (side=1) or left
     * (side=-1). The center of the ear is flush with the surface of the
     * head by moving it out by the radius, and rotating it around the z
     * axis to get it to the desired height. */
    var earframe = new THREE.Object3D();
    var ear = createEar(params);
    var radius = params.headRadius || 2;
    var angle = params.earAngle || Math.PI/4;
    ear.position.x = side * radius; // within the earframe
    earframe.rotation.z = side * angle;
    earframe.add(ear);
    head.add(earframe);
    return head;
}

function createEye(params) {
    var sd = params.sphereDetail || 10;
    var radius = params.eyeRadius || 0.3;
    var eyeGeometry = new THREE.SphereGeometry(radius,sd,sd);
    var color = params.eyeColor || 0x000000;
    var mat = new THREE.MeshBasicMaterial({color:color});
    var eyeMesh = new THREE.Mesh(eyeGeometry, mat);
    return eyeMesh;
}

function addEye(head,params,side) {
    /* adds an eye to the head on the right (side=1) or left
     * (side=-1). The center of the eye is flush with the surface of the
     * head by moving it out along the z axis by the radius, and rotating
     * it around the x and then y axes to get it to the desired height. */
    var eyeframe = new THREE.Object3D();
    var eye = createEye(params);
    var radius = params.headRadius || 2;
    eye.position.z = radius; // within the eyeframe
    var angleX = params.eyeAngleX || -Math.PI/6;
    var angleY = params.eyeAngleY || Math.PI/6;
    eyeframe.rotation.x = angleX;
    eyeframe.rotation.y = side * angleY;
    eyeframe.add(eye);
    head.add(eyeframe);
    return head;
}

function createHead(params) {
    /* Returns a teddy bear head object, with origin in the center, and
     * eyes on the +Z side of the head, and ears on the left (-X) and
     * right (+X) sides. */
    var head = new THREE.Object3D();

    var sd = params.sphereDetail || 10;
    var radius = params.headRadius || 2;
    var headGeometry = new THREE.SphereGeometry(radius, sd, sd);
    var color = params.headColor || 0xB07040;   // like body but slightly darker
    var mat = new THREE.MeshBasicMaterial({color: color});
    mat.wireframe = params.wireframe || false;
    var headMesh = new THREE.Mesh(headGeometry, mat);
    head.add(headMesh);
    if(params.nose) {
        addNose(head,params);
    }
    if(params.ears) {
        addEar(head,params,1);
        addEar(head,params,-1);
    }
    if(params.eyes) {
        addEye(head,params,1);
        addEye(head,params,-1);
    }
    return head;
}

function createLimb(radiusTop, radiusBottom, length, params) {
    /* returns an Object with the center at the top and the negative Y
     * axis running down the center. */
    var limb = new THREE.Object3D();
    var cd  = params.cylinderDetail || 10;
    // Turns out there's an error in Three.js if cd is a non-integer
    var limbGeom = new THREE.CylinderGeometry(radiusTop,radiusBottom,length,cd);
    var color = params.limbColor || 0xB07040;   // same as head, like body but slightly darker
    var mat = new THREE.MeshBasicMaterial({color:color});
    var limbMesh = new THREE.Mesh( limbGeom, mat );
    limbMesh.position.y = -length/2;
    limb.add(limbMesh);
    // limb.matrixAutoUpdate = false;
    // limb.updateMatrix();
    return limb;
}

function addArm(bear,params,side) {
    /* adds an arm to the bear on the right (side=1) or left (side=-1). */
    var top = params.armRadiusTop || 0.7;
    var bot = params.armRadiusBottom || 0.6;
    var len = params.armLength || 5;
    var arm = createLimb(top,bot,len,params);
    var radius = params.bodyRadius || 3;
    var scale = params.bodyScaleY || 2;
    var sx = params.shoulderWidth  || radius * 0.5;
    var sy = params.shoulderHeight || scale * radius * 0.7;
    arm.position.set( side * sx, sy, 0 );
    arm.rotation.z = side * Math.PI/2;
    // arm.children[0].updateMatrix();
    // arm.children[0].updateMatrixWorld();
    // arm.updateMatrix();
    // arm.updateMatrixWorld();
    // console.log('offvec: ', side*sx, sy);
    // console.log("arm local:", arm.matrix.elements);
    // console.log("arm global:", arm.matrixWorld.elements);
    // console.log("limbmesh local:", arm.children[0].matrix.elements);
    // console.log("limbmesh global:", arm.children[0].matrixWorld.elements);
    bear.add(arm);
}

function addLeg(bear,params,side) {
    /* adds a leg to the bear on the right (side=1) or left (side=-1). */
    var top = params.legRadiusTop || 0.7;
    var bot = params.legRadiusBottom || 0.6;
    var len = params.legLength || 5;
    var leg = createLimb(top,bot,len,params);
    leg.name = (side == 1 ? "right leg" : "left leg");
    var radius = params.bodyRadius || 3;
    var scale = params.bodyScaleY || 2;
    var hx = side * params.hipWidth  || side * radius * 0.5;
    var hy = params.hipHeight || scale * radius * -0.7;
    leg.position.set( hx, hy, 0 );
    leg.rotation.x = params.legRotationX;
    leg.rotation.z = side * params.legRotationZ;
    bear.add(leg);
}

function createBody(params) {
    if( !params ) params = {};
    var body = new THREE.Object3D();
    var radius = params.bodyRadius || 3;
    var sd = params.sphereDetail || 20;
    var bodyGeom = new THREE.SphereGeometry(radius,sd,sd);
    var bodyColor = params.bodyColor || 0xD08050;
    var mat = new THREE.MeshBasicMaterial({color: bodyColor});
    mat.wireframe = params.wireframe || false;
    var bodyMesh = new THREE.Mesh(bodyGeom, mat);
    var scale = params.bodyScaleY || 2;
    bodyMesh.scale.y = scale;
    body.add(bodyMesh);
    if(params.arms) {
        addArm(body,params,1);
        addArm(body,params,-1);
    }
    if(params.legs) {
        addLeg(body,params,1);
        addLeg(body,params,-1);
    }
    // bodyMesh.visible = false;
    // body.updateMatrix();
    return body;
}

function createTeddyBear(params) {
    var bear = new THREE.Object3D();
    var body = createBody(params);
    bear.add(body);
    if(params.head) {
        var head = createHead(params);
        var bs = params.bodyScaleY || 2;
        var br = params.bodyRadius || 3;
        var hr = params.headRadius || 1;
        // calculate position for the center of the head
        head.position.y = bs*br+hr;
        bear.add(head);
    }
    return bear;
}
