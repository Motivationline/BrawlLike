namespace TouchJoystick {
    export enum EVENT {
        /** Fired every time the input changes. Returns CustomEvent where event.detail is the current (unclamped) x/y values of the joystick. */
        CHANGE = "change",
        /** Fired when the virtual Joystick is pressed. */
        PRESSED = "pressed",
        /** Fired when the virtual Joystick is released. Returns CustomEvent where event.detail is the current (unclamped) x/y values of the joystick. */
        RELEASED = "released",
    }

    export type JoystickPositioning = "fixed" | "floating";
    export type JoystickLimitation = "none" | "x" | "y";
    export interface JoystickHandleOptions {
        /** Max distance from center point the inner ring can be visually pulled.  
         * 0 = no movement  
         * 1 = edge of the outer ring    
         * _Default: `1`_ 
        */
        limit: number,
        /** Whether the inner handle should behave like it is in a rounded or square limitation.  
         * _Default: `true`_
         */
        round: boolean,
    }

    /** A joystick comes with various functionalities out of the box. To configure them, set the options accordingly. They all come with reasonable defaults. */
    export interface JoystickOptions {
        /** How the joystick should be positioned.  
         * 
         * `"fixed"`: The joystick **doesn't** move within its parent to match the tapped starting point and only reacts to touches that start within its boundaries.  
         * `"floating"`: The joystick moves to the starting location of the tap within the parent element.  
         * _Default: `"fixed"`_
         */
        positioning: JoystickPositioning,
        /** Adjusts inner-handle related settings. */
        handle: JoystickHandleOptions,
        /** Allows you to limit the input of the joystick to one axis.  
         * Possible values: `"none" | "x" | "y"`  
         * _Default: `"none"`_
         */
        limitInput: JoystickLimitation,
        /** Makes the Joystick follow the touchpoint if it moves outside of the joystick handle limit. Only works in `positioning = "floating"` mode.  
         * _Default: `false`_ 
         */
        following: boolean,
        /** Inverts the output vertical value. Does not change the appearance of the joystick.  
         * _Default: `false`_
         */
        invertY: boolean,
        /** Limits the movement from the `following` attribute to the parents boundaries.  
         * _Default: `true`_
         */
        limitToParentElement: boolean
    }

    /** 
     * ### Joystick
     * 
     * A functional class without any dependencies that lets you easily create and use joysticks for mobile devices.
     * 
     * #### Access
     * To access the relevant info, you can either use the `horizontal` / `x` and `vertical` / `y` getters on demand or add any of the events defined in `TouchJoystick.EVENT`.
     * > ℹ The returned data ist **unclamped**. This means instead of getting a value from 0 to whatever the handle limit is (1 being the default, meaning the edge of the outer element), 
     * you'll get a value representative of how far the touch point actually is from the center of the joystick!
     * 
     * #### Styling
     * The joystick will be created as two styleable divs inside the given parent element. The parent element also defines the joysticks boundaries (can be disabled).
     * You can access the outer div using `joystick.element` for further editing (e.g. adding ids or classes).
     * 
     * For reactionary styling, various css classes are applied to the outer element to reflect the current state of the joystick. `active`, `inactive`, `fixed` and `floating`. See the `TouchJoystick.css` file for examples.
     */
    export class Joystick extends EventTarget {
        #options: JoystickOptions;
        #htmlOuterElement: HTMLElement;
        #htmlInnerElement: HTMLElement;
        #currentlyActiveTouchId: number = 0;
        #touchStart: { x: number, y: number };
        #currentValue: { x: number, y: number } = { x: 0, y: 0 };

        constructor(_parent: HTMLElement, _options?: Partial<JoystickOptions>) {
            super();

            this.#options = { ...this.defaultOptions, ..._options };

            // create and init html elements
            this.#htmlOuterElement = document.createElement("div");
            this.#htmlInnerElement = document.createElement("div");
            this.#htmlOuterElement.classList.add("touch-circle", "inactive");
            this.#htmlInnerElement.classList.add("touch-circle-inner");

            this.#htmlOuterElement.appendChild(this.#htmlInnerElement);
            _parent.appendChild(this.#htmlOuterElement);

            _parent.classList.add("touch-circle-parent");

            // setup listeners
            _parent.addEventListener("touchstart", <EventListener>this.hndTouchEvent);
            _parent.addEventListener("touchmove", <EventListener>this.hndTouchEvent);
            _parent.addEventListener("touchend", <EventListener>this.hndTouchEvent);

            // setup other things
            this.positioning = this.#options.positioning;
        }

        get defaultOptions(): JoystickOptions {
            return {
                following: false,
                handle: {
                    limit: 1,
                    round: true,
                },
                limitInput: "none",
                positioning: "fixed",
                invertY: false,
                limitToParentElement: true,
            }
        }

        /** The **unclamped** (see class documentation for more info) **horizontal (x)** distance between the center of the joystick and the current touch point. 0 if inactive.  
         * Equivalent to `.horizontal`
         */
        get x(): number {
            return this.#currentValue.x;
        }
        /** The **unclamped** (see class documentation for more info) **horizontal (x)** distance between the center of the joystick and the current touch point. 0 if inactive.  
         * Equivalent to `.x`
         */
        get horizontal(): number {
            return this.#currentValue.x;
        }
        /** The **unclamped** (see class documentation for more info) **vertical (y)** distance between the center of the joystick and the current touch point. 0 if inactive.  
         * Equivalent to `.vertical`
         */
        get y(): number {
            return this.#currentValue.y;
        }
        /** The **unclamped** (see class documentation for more info) **vertical (y)** distance between the center of the joystick and the current touch point. 0 if inactive.  
         * Equivalent to `.y`
         */
        get vertical(): number {
            return this.#currentValue.y;
        }
        /** The outer HTMLElement used to create & display the joystick. */
        get element(): HTMLElement {
            return this.#htmlOuterElement;
        }

        set positioning(_positioning: JoystickPositioning) {
            this.#options.positioning = _positioning;

            this.#htmlOuterElement.classList.remove("fixed", "floating");
            this.#htmlOuterElement.classList.add(_positioning);
        }

        get positioning(): JoystickPositioning {
            return this.#options.positioning;
        }

        set handle(_handle: JoystickHandleOptions){
            this.#options.handle = _handle;
        }

        set following(_following: boolean){
            this.#options.following = _following;
        }

        set limitToParentElement(_limitToParentElement: boolean){
            this.#options.limitToParentElement = _limitToParentElement;
        }

        set limitInput(_limitInput: JoystickLimitation){
            this.#options.limitInput = _limitInput;
        }
        set invertY(_invertY: boolean){
            this.#options.invertY = _invertY;
        }

        private hndTouchEvent = (_event: TouchEvent) => {
            let touches: TouchList = _event.changedTouches;
            if (!touches) return;

            let bcrParent = this.#htmlOuterElement.parentElement.getBoundingClientRect();
            let relativeTouchPoint = {
                x: touches[0].clientX - bcrParent.left,
                y: touches[0].clientY - bcrParent.top,
            }
            if (_event.type === "touchstart" && !this.#currentlyActiveTouchId) {
                if (this.positioning === "fixed") {
                    // did we click inside the element?
                    if (_event.target !== this.#htmlOuterElement) return;
                    let bcr = this.#htmlOuterElement.getBoundingClientRect();

                    this.#touchStart = { x: (bcr.left + bcr.width / 2) - bcrParent.left, y: (bcr.top + bcr.height / 2) - bcrParent.top };
                } else {
                    // set the position to wherever the touch originated
                    this.positionJoystick(relativeTouchPoint.x, relativeTouchPoint.y);
                }
                this.#htmlOuterElement.classList.remove("inactive");
                this.#htmlOuterElement.classList.add("active");
                this.#currentlyActiveTouchId = touches[0].identifier;

                this.dispatchEvent(new CustomEvent(EVENT.PRESSED));
                return;
            }

            if (_event.type === "touchend" && this.#currentlyActiveTouchId === touches[0].identifier) {
                this.#currentlyActiveTouchId = 0;
                this.#htmlInnerElement.style.top = "";
                this.#htmlInnerElement.style.left = "";
                this.#htmlOuterElement.style.top = "";
                this.#htmlOuterElement.style.left = "";
                this.#htmlOuterElement.classList.add("inactive");
                this.#htmlOuterElement.classList.remove("active");

                this.dispatchEvent(new CustomEvent(EVENT.RELEASED, { detail: this.#currentValue }));

                this.#currentValue.x = this.#currentValue.y = 0;

                return;
            }

            if (_event.type === "touchmove" && this.#currentlyActiveTouchId === touches[0].identifier) {
                let offsetX = relativeTouchPoint.x - this.#touchStart.x;
                let offsetY = relativeTouchPoint.y - this.#touchStart.y;

                if (this.#options.limitInput === "x") {
                    offsetX = 0;
                } else if (this.#options.limitInput === "y") {
                    offsetY = 0;
                }

                let bcrO = this.#htmlOuterElement.getBoundingClientRect();
                let bcrI = this.#htmlInnerElement.getBoundingClientRect();

                // scale offset so 1 = outline of outer element
                offsetX = offsetX / (bcrO.width / 2);
                offsetY = offsetY / (bcrO.height / 2);

                if (this.#options.following && (Math.abs(offsetX) > this.#options.handle.limit || Math.abs(offsetY) > this.#options.handle.limit)) {
                    // follow the finger position
                    let newPosX = Math.max(0, (Math.abs(offsetX) - this.#options.handle.limit)) * Math.sign(offsetX) * (bcrO.width / 2) + this.#touchStart.x;
                    let newPosY = Math.max(0, (Math.abs(offsetY) - this.#options.handle.limit)) * Math.sign(offsetY) * (bcrO.height / 2) + this.#touchStart.y;

                    // limit the movement to the parent element
                    if (this.#options.limitToParentElement) {
                        newPosX = Math.max(bcrO.width / 2, Math.min(bcrParent.width - bcrO.width / 2, newPosX));
                        newPosY = Math.max(bcrO.height / 2, Math.min(bcrParent.height - bcrO.height / 2, newPosY));
                    }

                    this.positionJoystick(newPosX, newPosY);
                }

                let visualOffsetX = offsetX;
                let visualOffsetY = offsetY;

                if (this.#options.handle.round) {
                    let { x, y } = this.normalizeToMaxScale({ x: visualOffsetX, y: visualOffsetY }, this.#options.handle.limit);
                    visualOffsetX = x;
                    visualOffsetY = y;
                }

                visualOffsetX = Math.max(Math.min(visualOffsetX, this.#options.handle.limit), -this.#options.handle.limit);
                visualOffsetY = Math.max(Math.min(visualOffsetY, this.#options.handle.limit), -this.#options.handle.limit);

                visualOffsetX = visualOffsetX * bcrO.width / 2 + (bcrO.width - bcrI.width) / 2;
                visualOffsetY = visualOffsetY * bcrO.height / 2 + (bcrO.height - bcrI.height) / 2;

                this.#htmlInnerElement.style.left = `${visualOffsetX}px`;
                this.#htmlInnerElement.style.top = `${visualOffsetY}px`;


                if (this.#options.invertY) {
                    offsetY *= -1;
                }

                this.#currentValue.x = offsetX;
                this.#currentValue.y = offsetY;

                this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: this.#currentValue }));

            }
        }

        private positionJoystick(x: number, y: number) {
            let bcr = this.#htmlOuterElement.getBoundingClientRect();

            this.#htmlOuterElement.style.left = `${x - bcr.width / 2}px`;
            this.#htmlInnerElement.style.left = "";
            this.#htmlOuterElement.style.top = `${y - bcr.height / 2}px`;
            this.#htmlInnerElement.style.top = "";

            this.#touchStart = { x: x, y: y };
        }

        private normalizeToMaxScale(_v: { x: number, y: number }, _scale: number = 1): { x: number, y: number } {
            let magnitude = Math.sqrt(Math.pow(_v.x, 2) + Math.pow(_v.y, 2));
            if (magnitude <= _scale) {
                return _v;
            }
            return {
                x: _v.x / magnitude * _scale,
                y: _v.y / magnitude * _scale,
            }

        }

    }


}