const {Objects} = require("./util/Objects");
const {Preconditions} = require("./Preconditions");
const {Rect} = require("./Rect");
const {Styles} = require("./util/Styles");

class Rects {

    /**
     * Make sure the rect is visible. If it has a zero width or height it's
     * not visible.
     * @param rect {Rect | DOMRect}
     * @return boolean True when the rect is visible.
     */
    static isVisible(rect) {
        return rect.height > 0 && rect.width > 0;
    }

    /**
     * Scale the rect based on the current values and the given scale.
     * @param rect {Rect}
     * @param scale {number}
     */
    static scale(rect, scale) {

        Preconditions.assertNotNull(rect, "rect");

        // make sure the input is valid before we work on it.
        rect = Rects.validate(rect);

        rect = Object.assign(new Rect(), rect);

        for(let key in rect) {

            if(! rect.hasOwnProperty(key))
                continue;

            rect[key] = rect[key] * scale;

        }

        return Rects.validate(rect);

    }

    /**
     * Make sure the given rect has all the correct properties and then return
     * the rect.
     *
     * @return {Rect}
     */
    static validate(rect) {

        Preconditions.assertNotNull(rect.left, "left");
        Preconditions.assertNotNull(rect.top, "top");
        Preconditions.assertNotNull(rect.width, "width");
        Preconditions.assertNotNull(rect.height, "height");
        Preconditions.assertNotNull(rect.bottom, "bottom");
        Preconditions.assertNotNull(rect.right, "right");

        Preconditions.assertNumber(rect.left, "left");
        Preconditions.assertNumber(rect.top, "top");
        Preconditions.assertNumber(rect.width, "width");
        Preconditions.assertNumber(rect.height, "height");
        Preconditions.assertNumber(rect.bottom, "bottom");
        Preconditions.assertNumber(rect.right, "right");

        if(! rect instanceof Rect) {
            return new Rect(rect);
        } else {
            return rect;
        }

    }

    /**
     * Assume that the given rect is relative to the point and return the new
     * rect.
     *
     * @param point {Point}
     * @param rect {Rect}
     */
    static relativeTo(point, rect) {

        rect = Rects.validate(rect);
        rect = Object.assign(new Rect(), rect);

        rect.left = rect.left + point.x;
        rect.top = rect.top + point.y;

        rect.right = rect.right + point.x;
        rect.bottom = rect.bottom + point.y;

        return Rects.validate(rect);

    }

    /**
     * Assume that the given rect is relative to the point and return the new
     * rect.
     *
     * This adjust ALL properties including top, left, bottom, right
     *
     * @param rect {Rect} The rect to move.
     * @param dir {Object} Move the rect in the given dir (direction) in the
     * x and y plane.  The dir.x and dir.y specify how much to move the rect.
     * @param absolute {boolean} When true, move to the absolute position, not
     *                           relative.
     * @return {Rect}
     */
    static move(rect, dir, absolute) {

        rect = Object.assign(new Rect(), rect);

        if(absolute) {

            if("x" in dir) {
                rect.left = dir.x;
                rect.right = rect.left + rect.width;
            }

            if("y" in dir) {
                rect.top = dir.y;
                rect.bottom = rect.top + rect.height;
            }

        } else {

            // TODO: I could just convert the relative positions to absolute to
            // clean up this code a bit.
            if("x" in dir) {
                rect.left = rect.left + dir.x;
                rect.right = rect.right + dir.x;
            }

            if("y" in dir) {
                rect.bottom = rect.bottom + dir.y;
                rect.top = rect.top + dir.y;
            }

        }

        return Rects.validate(rect);

    }

    /**
     * Return true if the two rects intersect.
     *
     * @param a {Rect|Object}
     * @param b {Rect|Object}
     *
     * @return {boolean}
     */
    static intersect(a, b) {

        // TODO: internally we should convert the object to a rect so we can
        // validate it.

        return (a.left <= b.right &&
                b.left <= a.right &&
                a.top <= b.bottom &&
                b.top <= a.bottom)

    }

    /**
     * Return true if the two rects overlap. This includes intersection but also
     * includes one completely swallowing the other.
     *
     * @param a {Rect}
     * @param b {Rect}
     *
     * @return {boolean}
     */
    static overlap(a, b) {
        return a.toLine("x").overlaps(b.toLine("x")) || a.toLine("y").overlaps(b.toLine("y"));
    }

    /**
     * Compute the intersection of a and b as a new rect.
     *
     *
     * @param a {Rect}
     * @param b {Rect}
     * @return {Rect}
     */
    static intersection(a,b) {

        // TODO/refactor.  Make each dimension a line, then adjust the line.
        // This way the same function is used twice with less copy/paste.

        return Rects.createFromBasicRect({
            top: Math.max(a.top, b.top),
            bottom: Math.min(a.bottom, b.bottom),
            left: Math.max(a.left, b.left),
            right: Math.min(a.right, b.right),
        });

    }

    /**
     * Return the positions where `a` (reference) is intersected by `b`.  If
     * all four sizes are present a envelops b.
     *
     * @param a {Rect}
     * @param b {Rect}
     * @return {Array<string>}
     */
    static intersectedPositions(a, b) {

        let result = [];

        if(_interval(a.left, b.right, a.right)) {
            result.push("left");
        }

        if(_interval(a.left, b.left, a.right)) {
            result.push("right");
        }

        if(_interval(a.top, b.bottom, a.bottom)) {
            result.push("top");
        }

        if(_interval(a.top, b.top, a.bottom)) {
            result.push("bottom");
        }

        return result;

    }

    /**
     * Take two rects and return the positions relative to one another.  We
     * assume that the rects to not intersect.
     *
     * @param a {Rect}
     * @param b {Rect}
     * @return {Object}
     */
    static relativePositions(a, b) {

        Rects.validate(a);
        Rects.validate(b);

        let result = {};

        // basically this is the degree AWAY from given position.  Negative
        // values would be BEFORE the position.

        result.top = Math.abs(a.top - b.bottom);
        result.bottom = Math.abs(a.bottom - b.top);
        result.left = Math.abs(a.left - a.right);
        result.right = Math.abs(a.right - b.left);

        return result;

    }

    /**
     * Subtract second rect from the first and return a virtual rect with the
     * change in elements. The change is virtual as we could record a rect with
     * negative width for a given line which would be an imaginary geometric
     * object.
     *
     * @param a {Rect}
     * @param b {Rect}
     */
    static subtract(a, b) {

        a = Rects.validate(a);
        b = Rects.validate(b);

        let keys = ["left", "top", "right", "bottom", "width", "height"];

        let result = {};

        keys.forEach(key => {
            result[key] = a[key] - b[key];
        });

        return new Rect(result);

    }

    /**
     * Add two rects together to build a new rect.  The second rect could be
     * virtual and have a negative width for a line.
     *
     * @param a {Rect}
     * @param b {Rect}
     */
    static add(a, b) {

        a = Rects.validate(a);
        b = Rects.validate(b);

        let keys = ["left", "top", "right", "bottom", "width", "height"];

        let result = {};

        keys.forEach(key => {
            result[key] = a[key] + b[key];
        });

        return new Rect(result);

    }

    /**
     * Return the percentage that a takes of b, a is assumed to be <= b in terms
     * of dimensions and on the same coordinate plane.
     *
     * @param a {Rect}
     * @param b {Rect}
     * @return {Rect}
     */
    static perc(a, b) {

        if(a.width > b.width || a.height > b.height) {
            throw new Error(`Dimensions invalid ${a.dimensions} vs ${b.dimensions}`);
        }

        let result = {
            left: 100 * (a.left / b.width),
            right: 100 * (a.right / b.width),
            top: 100 * (a.top / b.height),
            bottom: 100 * (a.bottom / b.height)
        };

        return Rects.createFromBasicRect(result);

    }

    /**
     * Create a full rect from a rect that has top, left, width, height only.
     *
     * @param rect {Rect | Object}
     * @return {Rect}
     */
    static createFromBasicRect(rect) {

        rect = Object.assign(new Rect(), rect);

        // TODO: add x,y in the future.

        // the optional ones are bottom+right or width+height but we could add
        // support for other optional ones...

        // it might be better to say, if var0 and var1 are defined, I can compute
        // var2 or var 3... and then define them when they are not defined.  For
        // example. If top and height are defined, I can define bottom.

        if(! rect.bottom && "top" in rect && "height" in rect) {
            rect.bottom = rect.top + rect.height;
        }

        if(! rect.right && "left" in rect && "width" in rect) {
            rect.right = rect.left + rect.width;
        }

        if(! rect.height && "bottom" in rect && "top" in rect) {
            rect.height = rect.bottom - rect.top;
        }

        if(! rect.width && "right" in rect && "left" in rect) {
            rect.width = rect.right - rect.left;
        }

        return Rects.validate(new Rect(rect));

    }

    /**
     * Create a new rect from the given lines
     * @param xAxis {Line}
     * @param yAxis {Line}
     * @return {Rect}
     */
    static createFromLines(xAxis, yAxis) {

        Preconditions.assertNotNull(xAxis, "xAxis");
        Preconditions.assertNotNull(yAxis, "yAxis");
        Preconditions.assertEqual(xAxis.axis, "x", "xAxis.axis");
        Preconditions.assertEqual(yAxis.axis, "y", "yAxis.axis");

        return Rects.createFromBasicRect({
            left: xAxis.start,
            width: xAxis.length,
            top: yAxis.start,
            height: yAxis.length
        })

    }

    /**
     *
     * @param element {HTMLElement}
     * @return {Rect}
     */
    static createFromOffset(element) {

        // FIXME: if I'm using this it might not be what I want.

        return Rects.createFromBasicRect({
            left: element.offsetLeft,
            top: element.offsetTop,
            width: element.offsetWidth,
            height: element.offsetHeight,
        });

    }

    /**
     * Parse the positioning from the style with left, top width and height and then
     * return this as a rect.
     * @param element {HTMLElement}
     */
    static fromElementStyle(element) {

        let rect = {

            left: Styles.parsePX(element.style.left),
            top: Styles.parsePX(element.style.top),
            width: Styles.parsePX(element.style.width),
            height: Styles.parsePX(element.style.height)

        };

        return Rects.createFromBasicRect(rect);

    }

}

/**
 * Return true if the point is within the given min and max interval.
 *
 * @param min {number}
 * @param point {number}
 * @param max {number}
 * @private
 * @return {boolean}
 */
function _interval(min,point,max) {
    // TODO: migrate this to use a Line.holds
    return min <= point && point <= max;
}

module.exports.Rects = Rects;
