// camera.js
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useKeyboardControls } from "@react-three/drei";
import gsap from "gsap";
import Swal from 'sweetalert2';

function ClawCamera({ clawPos, setClawPos, isClawDown, setIsClawDown, setHasPrize, setIsLowering, clawModelRef }) {
    const camRef = useRef();
    const [, getKeys] = useKeyboardControls();

    const speed = 0.05;
    const limitX = 0.4;
    const limitZ = 0.4;

    // 現在只需要一個 Ref 來控制夾子的開合
    const gripperRef = useRef(); // 代表夾子可動的那個部件

    // 在元件掛載後，嘗試獲取爪子的子部件
    useEffect(() => {
        if (clawModelRef.current) {
            console.log("Traversing claw model from ClawCamera:", clawModelRef.current);
            clawModelRef.current.traverse((child) => {
                console.log("Child name in ClawCamera:", child.name, "Child type:", child.type);
                // *** 這裡是你需要根據你的 GLTF 模型修改的關鍵！ ***
                // 找出你的模型中，實際代表「可開合的夾子部分」的名稱
                // 可能是 "gripper", "claw_arm", "pincer", 或甚至是 "claw" 的某個子部件
                if (child.name === "clawArm") { // 假設你的夾子可動部分的名稱是 "clawArm"
                    gripperRef.current = child;
                    console.log("Found gripperRef:", gripperRef.current);
                }
                // 如果你的模型中夾子開合是由多個部件控制，例如左右兩片，則需要分別找到它們
                // 但如果你只有一個整體性的「爪子」且它的開合是通過自身的旋轉來控制，
                // 那麼只需一個 ref。
            });
        }
    }, [clawModelRef.current]);

    useFrame(() => {
        const { forward, backward, left, right, dropClaw } = getKeys();

        // 僅當爪子未在下降中時才允許移動
        if (!isClawDown) {
            if (forward && clawPos.z > -limitZ) {
                setClawPos(prev => ({ ...prev, z: prev.z - speed }));
            }
            if (backward && clawPos.z < limitZ) {
                setClawPos(prev => ({ ...prev, z: prev.z + speed }));
            }
            if (right && clawPos.x < limitX) {
                setClawPos(prev => ({ ...prev, x: prev.x + speed }));
            }
            if (left && clawPos.x > -limitX) {
                setClawPos(prev => ({ ...prev, x: prev.x - speed }));
            }

            if (dropClaw) {
                // 每次下爪前，確保爪子是張開的初始狀態
                if (gripperRef.current) {
                    gsap.to(gripperRef.current.rotation, {
                        y: Math.PI / 6, // 假設這個角度代表張開狀態
                        duration: 0.2
                    });
                } else {
                    console.warn("Gripper ref not found for initial open state.");
                }


                setHasPrize(false);
                setIsLowering(true);
                setIsClawDown(true);

                console.log("Claw initiated descent.");

                const isWin = Math.random() < 0.5; // 50% 機率中獎

                // GSAP 動畫序列
                const tl = gsap.timeline();

                tl.to(clawPos, {
                    y: -1.5, // 調整這個值讓爪子足夠低，但不要穿過地面
                    duration: 1.5, // 下降時間
                    ease: "power1.in",
                    onUpdate: () => setClawPos({ ...clawPos }) // 強制組件重新渲染以更新位置
                })
                // 2. 爪子閉合（抓取動作）
                // 只有當 gripperRef 存在時才添加到時間線
                .add(() => { // 使用 .add() 可以在時間線中插入一個條件執行的動畫
                    if (gripperRef.current) {
                        gsap.to(gripperRef.current.rotation, {
                            y: 0, // 假設 0 代表閉合狀態
                            duration: 0.3,
                            ease: "power1.out",
                            onComplete: () => {
                                console.log("Claw closed.");
                            }
                        });
                    } else {
                        console.warn("Gripper ref not found for closing animation.");
                    }
                }, ">-0.1") // '> -0.1' 表示這個動畫在 clawPos 下降動畫結束前0.1秒開始，讓動作更流暢
                // 3. 爪子上升
                .to(clawPos, {
                    y: 0, // 回到初始高度
                    duration: 1.5, // 上升時間
                    ease: "power1.out",
                    onUpdate: () => setClawPos({ ...clawPos }),
                    onComplete: () => {
                        setIsLowering(false); // 爪子已完成上升

                        // 4. 根據是否中獎來處理後續邏輯
                        if (isWin) {
                            console.log("Winner!");
                            Swal.fire({
                                title: '中獎了!',
                                text: '恭喜你中獎了!',
                                icon: 'success',
                                confirmButtonText: '確定'
                            });
                            setHasPrize(true); // 設定中獎狀態

                            // 爪子在中獎後稍微張開以釋放獎品
                            if (gripperRef.current) {
                                gsap.to(gripperRef.current.rotation, {
                                    y: Math.PI / 6, // 張開角度
                                    duration: 0.3,
                                    delay: 0.5, // 延遲一點時間再張開
                                    onComplete: () => {
                                        setIsClawDown(false); // 重置爪子狀態，允許再次移動
                                        setHasPrize(false); // 獎品已經放下了，重置狀態
                                    }
                                });
                            } else {
                                console.warn("Gripper ref not found for prize release animation.");
                                setIsClawDown(false); // 如果沒有爪子動畫，也重置狀態
                                setHasPrize(false);
                            }

                        } else {
                            console.log("No prize this time.");
                            Swal.fire({
                                title: '沒中獎',
                                text: '再接再厲!',
                                icon: 'error',
                                confirmButtonText: '確定'
                            });
                            // 如果沒中獎，爪子直接回到初始狀態並保持閉合或輕微張開
                            setIsClawDown(false); // 重置爪子狀態，允許再次移動
                            // 確保爪子是閉合的，或者回到你的預設值
                            if (gripperRef.current) {
                                gsap.to(gripperRef.current.rotation, {
                                    y: 0, // 保持閉合或回到你的預設值
                                    duration: 0.1,
                                });
                            }
                        }
                    }
                });
            }
        }

        if (camRef.current) {
            camRef.current.lookAt(0, 1, 0); // 確保攝像機始終看向夾子區域
        }
    });

    return (
        <>
            <PerspectiveCamera
                ref={camRef}
                makeDefault
                position={[0, 1, 3]} // 攝像機起始位置
            />
        </>
    );
}

export default ClawCamera;