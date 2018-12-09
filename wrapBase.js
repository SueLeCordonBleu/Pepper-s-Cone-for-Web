class wrapBase {
    constructor( _mapDiv, _flipTexture, _power, _alpha,_uniforms){
        this.mapDiv = _mapDiv;
        this.flipTexture = _flipTexture;
        this.power = _power;
        this.alpha = _alpha;
        this.tabletScreenScale = new THREE.Vector3(4.0, 3.0, 1.0);
        this.material = new THREE.ShaderMaterial({
            uniforms: _uniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });
        this.LOAD_TEX_COLOR_BIT_DEPTH = 8; //Acturally this is a const. But I don't know how to write that in JS classes.
        this.canvas = document.createElement( 'canvas' );
    }

    //the next function is quoted and adapted from https://github.com/mrdoob/three.js/issues/758
    getImageData(image) {
        console.log('start to extract imagedata');
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        console.log(this.canvas.width, this.canvas.height);
        
        var context = this.canvas.getContext( '2d' );
        context.drawImage( image, 0, 0); 
        var imageData = context.getImageData( 0, 0, image.width, image.height);
        return imageData.data;
    }
    //quoting ends here

    convertRGBATexture2Map(encodedMap){
        var imgData = this.getImageData(encodedMap);
        console.log(imgData);
        var revisedData = new Float32Array(imgData.length);
        console.log('empty imagedata length   ' + revisedData.length);

        var ec = new Uint8Array(4);
        for (var pixel = 0; pixel < imgData.length/4; ++pixel)
		{
            ec[0] = imgData[pixel*4+0]; //R
            ec[1] = imgData[pixel*4+1]; //G
            ec[2] = imgData[pixel*4+2]; //B
            ec[3] = imgData[pixel*4+3]; //A
            revisedData[pixel*4+0] = ((ec[0]*2*2*2*2*2*2*2*2) + ec[1]) / this.mapDiv;
            revisedData[pixel*4+1] = ((ec[2]*2*2*2*2*2*2*2*2) + ec[3]) / this.mapDiv;
            // Dependng on the UV coordination direction, map_y needs to be flipped
            if (this.flipTexture){
				revisedData[pixel*4+1] = 1.0 - revisedData[pixel*4+1];
            }
        }
        console.log ("done converting from RGBA to map");
        var decodedMapResult = new THREE.DataTexture(revisedData, encodedMap.width, encodedMap.height, THREE.RGBAFormat, THREE.FloatType, undefined, undefined,undefined,THREE.LinearFilter,THREE.LinearFilter,1);
        decodedMapResult.needsUpdate = true;
        return decodedMapResult;
    }
    
    lateUpdate(){
        //Haven't done the rotation Quaternion Part！z-axis data should be -RotationManager.RotationAngle  （angle is in radians.）Math.PI / 2 
        var rot = new THREE.Quaternion();
        rot.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), 0);
        //Quaternion rot = Quaternion.Euler (0, 0, -RotationManager.RotationAngle);
        
        var m = new THREE.Matrix4()
        var Sm = new THREE.Matrix4(); //Scale Matrix
        Sm.set(1.0/this.tabletScreenScale.x, 0, 0, 0,
               0, 1.0/this.tabletScreenScale.y, 0, 0,
               0, 0, 1.0, 0,
               0, 0, 0, 1.0);
        var TRSm = new THREE.Matrix4();
        TRSm.compose ( new THREE.Vector3(0.0,0.0,0.0), rot, this.tabletScreenScale); 
        m = Sm.multiply(TRSm);

		this.material.uniforms._TexRotationVec.value = new THREE.Vector4(m.elements[0], m.elements[4], m.elements[2], m.elements[5]);
        this.material.uniforms._power.value = this.power;
        this.material.uniforms._alpha.value = this.alpha;
        this.material.uniforms.RenderedTex.value = bufferTexture;
        this.material.uniforms.MapTex.value = decodedMap;
    }

}