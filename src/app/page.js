// page.js
"use client"
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, CameraControls, Environment, useGLTF, ContactShadows,
  PerspectiveCamera, axesHelper, KeyboardControls, useKeyboardControls, Box} from "@react-three/drei";
import { Suspense, useEffect, useState, useRef } from "react";
import ClawCamera from "@/component/ClawCamera";


// ClawModel現在會接收isClawDown和hasPrize狀態
function ClawModel({clawPos, isClawDown, hasPrize, clawModelRef}){ // 這裡新增 clawModelRef
  const clawModel = useGLTF(`claw.glb`);

  // 將載入的模型場景賦值給傳入的 ref
  useEffect(() => {
    if (clawModel.scene && clawModelRef) {
      clawModelRef.current = clawModel.scene;
    }
  }, [clawModel.scene, clawModelRef]);


  useFrame(()=>{
    if(clawModelRef.current){ // 現在使用 clawModelRef.current 來遍歷
      clawModelRef.current.traverse((child)=>{

        // 假設你的模型中，"claw"是整個可移動的爪頭部分，"clawBase"是固定在軌道上的基座
        // 而"track"是軌道本身
        // 如果你的爪子模型整體可以上下移動，請確保這個 "claw" 部件的 position.y 是受 clawPos.y 控制的

        // 這裡的 'claw' 應該是 GLTF 模型中代表 '夾子主體' 的那個部件名稱
        if(child.name === "claw"){ // 請確保這個名稱和你的 .glb 模型中的一致
          child.position.set(clawPos.x, clawPos.y + 2.85, clawPos.z);
          // 這裡不再直接控制開合，開合交給ClawCamera中的GSAP
        }

        if(child.name === "clawBase"){ // 請確保這個名稱和你的 .glb 模型中的一致
          child.position.set(clawPos.x, 2.85, clawPos.z);
        }

        if(child.name === "track"){ // 請確保這個名稱和你的 .glb 模型中的一致
          child.position.set(0, 2.85, clawPos.z);
        }

      });
    }
  });

  return (<>
    <primitive
      // 不再需要內部 ref，直接將 model.scene 賦值給 props 傳入的 ref
      object={clawModel.scene}
      scale={[0.6, 0.6, 0.6]}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  </>)

}


export default function Home() {

  const isHidden = true;

  const [clawPos, setClawPos] = useState({x: 0, y: 0, z: 0});
  const [isClawDown, setIsClawDown] = useState(false);
  const [hasPrize, setHasPrize] = useState(false);
  const [isLowering, setIsLowering] = useState(false);

  // 在 Home 元件中創建 clawModelRef
  const clawModelRef = useRef();


  return (
    <div className="w-full h-screen">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "dropClaw", keys: ["Space"] },
        ]}
      >
        <Canvas>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />


          {
            !isHidden && <RoundedBox
              args={[1, 1, 1]}
              radius={0.05}
              smoothness={4}
              bevelSegments={4}
              creaseAngle={0.4}
            >
              <meshPhongMaterial color="#f3f3f3"/>
            </RoundedBox>
          }

          {/* 將 clawModelRef 傳遞給 ClawModel 和 ClawCamera */}
          <Suspense fallback={null}>
            <ClawModel clawPos={clawPos} isClawDown={isClawDown} hasPrize={hasPrize} clawModelRef={clawModelRef} />
          </Suspense>


          <Environment
            background={true}
            backgroundBlurriness={0.5}
            backgroundIntensity={1}
            environmentIntensity={1}
            preset={'city'}
          />

          <ContactShadows opacity={1} scale={10} blur={10} far={10} resolution={256} color="#DDDDDD" />

          {/* 將 clawModelRef 作為 props 傳遞給 ClawCamera */}
          <ClawCamera
            clawPos={clawPos}
            setClawPos={setClawPos}
            isClawDown={isClawDown}
            setIsClawDown={setIsClawDown}
            setHasPrize={setHasPrize}
            setIsLowering={setIsLowering}
            clawModelRef={clawModelRef} // 將創建的 ref 傳入
          />
          <CameraControls />
          <axesHelper args={[10]} />


        </Canvas>
      </KeyboardControls>
    </div>
  );
}