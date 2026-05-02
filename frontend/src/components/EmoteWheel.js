import {useEffect, useRef, useState} from "react";
import '../styles/components/Emote.css'


export const EmoteWheel = ({onEmoteEvent}) => {
    const [showEmoteWheel, setShowEmoteWheel] = useState(false);
    const [hoveredEmote, setHoveredEmote] = useState(null);
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
                if (hoveredEmote !== null) {
                    hoveredEmote.classList.remove("hover")
                    const emoteType = hoveredEmote.classList.contains("emote-top") ? 'top' :
                        hoveredEmote.classList.contains("emote-left") ? 'left' :
                            hoveredEmote.classList.contains("emote-right") ? 'right' :
                                hoveredEmote.classList.contains("emote-bottom") ? 'bottom' : null;
                    if (emoteType === null) return;
                    onEmoteEvent(emoteType)
                    setHoveredEmote(null)
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('keyup', handleKeyUp)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('keyup', handleKeyUp)
        }
    }, [onEmoteEvent, hoveredEmote]);

    useEffect(() => {
        if (showEmoteWheel) {
            const handleEmoteHover = (ref) => {
                ref.current?.classList.add("hover");
                setHoveredEmote(ref.current)
            }
            const handleEmoteUnselect = (ref) => {
                setHoveredEmote(null)
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
        <div className="emote-wheel-wrapper">
            <div className={`emote-wheel ${showEmoteWheel ? '' : 'scale-down'}`}>
                <div className="emote emote-left media-container" ref={emoteLeft}>
                    <img src="/emote-left.webp" alt="left emote (thinking)"/>
                </div>
                <div className="emote emote-top media-container" ref={emoteTop}>
                    <img src="/emote-top.webp" alt="top emote (waving)"/>
                </div>
                <div className="emote emote-right media-container" ref={emoteRight}>
                    <img src="/emote-right.webp" alt="right emote (laughing)"/>
                </div>
                <div className="emote emote-bottom media-container" ref={emoteBottom}>
                    <img src="/emote-bottom.webp" alt="bottom emote (angry)"/>
                </div>
            </div>
        </div>
    )
}

export function playEmote(emoteType, parentElement) {
    const el = document.createElement("div");
    el.classList.add(`played-emote-${emoteType}`, "media-container", "played-emote");
    const img = document.createElement("img")
    img.src = `/emote-${emoteType}.webp`
    img.alt = `${emoteType} emote`;
    el.appendChild(img);
    parentElement.appendChild(el);


    setTimeout(() => {
        el.classList.add("scale-out")
        setTimeout(() => parentElement.removeChild(el), 250)
    }, 3000)
}