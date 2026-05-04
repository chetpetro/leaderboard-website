import {useEffect, useRef, useState} from "react";
import '../styles/components/RandomMapSuggester.css'
import {Link} from "react-router-dom";
import {ToggleButton} from "./ToggleButton";

export const RandomMapSuggester = ({maps}) => {
    const flexGapRem = .5;
    const animationTicks = 400;
    const mapAmnt = 100;
    const [itemWidthRem, setItemWidthRem] = useState(15);
    const mapListWidth = mapAmnt * (itemWidthRem + flexGapRem);
    const [randomMaps, setRandomMaps] = useState([]);
    const [inAnimation, setInAnimation] = useState(false);
    const [isReducedMotion, setIsReducedMotion] = useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    const mapSelector = useRef()
    const scrollXRef = useRef(0)
    const currentTickRef = useRef(0)
    const scrollTargetRef = useRef({
        x: 0,
        index: 0
    })
    const startScrollXRef = useRef(0)
    const animationFrameRef = useRef(null)

    useEffect(() => {
        // select 20 random maps from maps
        const shuffled = [...maps].sort(() => 0.5 - Math.random());
        setRandomMaps(shuffled.slice(0, mapAmnt));
        scrollXRef.current = 0;
        currentTickRef.current = 0;
        scrollTargetRef.current = {x: 0, index: 0};
        startScrollXRef.current = 0;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mapSelector.current) {
            mapSelector.current.style.setProperty('--scroll-x', `-0rem`);
        }
    }, [maps]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

        const mediaQuery = window.matchMedia("(min-width: 864px)");

        const handleMediaChange = (e) => {
            setItemWidthRem(e.matches ? 25 : 15);
        };

        // Set initial value
        setItemWidthRem(mediaQuery.matches ? 20 : 15);

        // Listen for changes
        mediaQuery.addEventListener("change", handleMediaChange);
        return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }, []);

    const getWrappedScrollX = (value) => {
        const wrapped = value % mapListWidth;
        return (wrapped + mapListWidth) % mapListWidth;
    }

    const setScrollPosition = (value) => {
        scrollXRef.current = value;
        if (!mapSelector.current) return;
        mapSelector.current.style.setProperty('--scroll-x', `-${scrollXRef.current}rem`);
    }

    const executeTick = () => {
        if (!mapSelector.current) return;
        setScrollPosition(scrollXRef.current);
        currentTickRef.current++;
        if (currentTickRef.current > animationTicks) {
            setInAnimation(false)
            return
        }
        let newScrollValue = customSpeedEaseCurve(currentTickRef.current / animationTicks, scrollTargetRef.current.x, startScrollXRef.current)
        newScrollValue = getWrappedScrollX(newScrollValue);
        scrollXRef.current = newScrollValue;
        animationFrameRef.current = requestAnimationFrame(executeTick)
    }

    const handleShuffle = () => {
        if (!mapSelector.current) return;
        const mapIndexToSelect = Math.floor(Math.random() * mapAmnt);
        scrollTargetRef.current = {
            x: (mapIndexToSelect-2 + mapAmnt) * (itemWidthRem + flexGapRem),
            index: mapIndexToSelect
        }
        startScrollXRef.current = scrollXRef.current;
        currentTickRef.current = 0;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setInAnimation(true)
        if (isReducedMotion) {
            setScrollPosition(getWrappedScrollX(scrollTargetRef.current.x));
            requestAnimationFrame(() => setInAnimation(false))
            return;
        }
        animationFrameRef.current = requestAnimationFrame(executeTick);
    }

    const handleReducedMotionToggle = () => {
        const nextIsReducedMotion = !isReducedMotion;
        if (nextIsReducedMotion && animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsReducedMotion(nextIsReducedMotion);
    }

    const renderEntries = () => {
        return randomMaps.map((map) => (
                <div className="map-entry-cnt" key={map._id}>
                    <Link to={`/${map.steamID}`} className="map">
                        <div className="map-blurred-bg media-container">
                            <img src={map.previewImage} alt="" />
                        </div>
                        <div className="map-img-cnt media-container">
                            <img src={map.previewImage} alt={`${map.mapName} preview`} />
                        </div>
                        <div className="map-info">
                            <h3>{map.mapName}</h3>
                            <p className="playerAmount">👤 {map.entries.length}</p>
                        </div>
                    </Link>
                </div>
        ))
    }
    return (
        <div className="random-map-suggester" id="suggest-map">
            <div className="inside">
                <h2>Play a random map</h2>
                <div className="dash-container desc-cnt">
                    <span className="dash"></span>
                    <p>
                        Not sure which map to play? Try this!
                    </p>
                </div>
                <div className={`map-selector-cnt ${inAnimation ? '' : 'animated'}`}>
                    <div className="map-selector" ref={mapSelector} style={{
                        '--item-width': itemWidthRem + "rem",
                        '--flex-gap': flexGapRem + "rem",
                    }}>
                        {renderEntries()}
                        {renderEntries()}
                    </div>
                </div>
                <div className="buttons">
                    <button type="button" className="btn btn-primary" onClick={handleShuffle}>
                        Random Map 🔀
                    </button>
                    <ToggleButton
                        isOn={isReducedMotion}
                        onToggle={handleReducedMotionToggle}
                        label="Reduced motion (Flash warning)"
                        onLabel="on"
                        offLabel="off"
                        className="btn-small"
                    />
                </div>
            </div>
        </div>
    )
}


function customSpeedEaseCurve(tick, targetX, startX = 0) {
    if (typeof tick !== 'number' || isNaN(tick)) return startX;
    const t = Math.max(0, Math.min(1, tick));

    // Skew t so the last ~1/4 is stretched out
    const tSkewed = Math.pow(t, 0.3);

    const k = 6;
    const y0 = (Math.tanh(-0.5 * k) + 1) / 2;
    const y1 = (Math.tanh( 0.5 * k) + 1) / 2;

    const y = (Math.tanh((tSkewed - 0.5) * k) + 1) / 2;
    const yNorm = (y - y0) / (y1 - y0);

    return startX + yNorm * (targetX - startX);
}