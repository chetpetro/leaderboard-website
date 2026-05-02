import {useEffect, useRef, useState} from "react";
import '../styles/components/Emote.css'


export const EmoteWheel = ({onTopEmoteEvent, onLeftEmoteEvent, onRightEmoteEvent}) => {
    const [showEmoteWheel, setShowEmoteWheel] = useState(false);
    const emoteTop = useRef();
    const emoteLeft = useRef();
    const emoteRight = useRef();
    const emoteBottom = useRef();



    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'e') {
                setShowEmoteWheel(true)
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'e') {
                setShowEmoteWheel(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('keyup', handleKeyUp)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('keyup', handleKeyUp)
        }
    }, [onTopEmoteEvent, onLeftEmoteEvent, onRightEmoteEvent]);

    useEffect(() => {
        if (showEmoteWheel) {
            const handleEmoteHover = (ref) => {
                console.log("handleEmoteHover")
                ref.current?.classList.add("hover");
            }
            const handleEmoteUnselect = (ref) => {
                console.log("handleEmoteUnselect")
                ref.current?.classList.remove("hover");
            }
            const emoteWheelHoverListener = (e) => {
                if (showEmoteWheel) {
                    if (e.key === 'w') handleEmoteHover(emoteTop)
                    else if (e.key === 'a') handleEmoteHover(emoteLeft)
                    else if (e.key === 'd') handleEmoteHover(emoteRight)
                    else if (e.key === 's') handleEmoteHover(emoteBottom)
                }
            }
            const emoteWheelSelectListener = (e) => {
                if (showEmoteWheel) {
                    if (e.key === 'w') handleEmoteUnselect(emoteTop)
                    else if (e.key === 'a') handleEmoteUnselect(emoteLeft)
                    else if (e.key === 'd') handleEmoteUnselect(emoteRight)
                    else if (e.key === 's') handleEmoteUnselect(emoteBottom)
                }
            }
            document.addEventListener('keydown', emoteWheelHoverListener)
            document.addEventListener('keyup', emoteWheelSelectListener)
            return () => {
                document.removeEventListener('keydown', emoteWheelHoverListener)
                document.removeEventListener('keyup', emoteWheelSelectListener)
            }
        }

    }, [showEmoteWheel])



    return (
        <div className={`emote-wheel ${showEmoteWheel ? '' : 'scale-down'}`}>
            <div className="emote emote-left media-container" ref={emoteLeft}>
                <img src="/bee.png" alt="left emote (thinking)"/>
            </div>
            <div className="emote emote-top media-container" ref={emoteTop}>
                <img src="/bee.png" alt="top emote (waving)"/>
            </div>
            <div className="emote emote-right media-container" ref={emoteRight}>
                <img src="/bee.png" alt="right emote (laughing)"/>
            </div>
            <div className="emote emote-bottom media-container" ref={emoteBottom}>
                <img src="/bee.png" alt="bottom emote (angry)"/>
            </div>
        </div>
    )
}