
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/HeaderBar.svelte generated by Svelte v3.12.1 */

    const file = "src/components/HeaderBar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (33:2) {#each data as item}
    function create_each_block(ctx) {
    	var p0, t0, t1_value = ctx.item.ssid + "", t1, t2, p1, t3, t4_value = ctx.item.bssid + "", t4, t5, p2, t6, t7_value = ctx.item.channel + "", t7, t8, p3, t9, t10_value = ctx.item.signal_level + "", t10, t11, p4, t12, t13_value = ctx.item.security + "", t13;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Current SSID: ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Current BSSID: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Current Channel: ");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Signal Level: ");
    			t10 = text(t10_value);
    			t11 = space();
    			p4 = element("p");
    			t12 = text("Security: ");
    			t13 = text(t13_value);
    			attr_dev(p0, "class", "current-data svelte-1s1yday");
    			add_location(p0, file, 33, 4, 712);
    			attr_dev(p1, "class", "current-data svelte-1s1yday");
    			add_location(p1, file, 34, 4, 770);
    			attr_dev(p2, "class", "current-data svelte-1s1yday");
    			add_location(p2, file, 35, 4, 830);
    			attr_dev(p3, "class", "current-data svelte-1s1yday");
    			add_location(p3, file, 36, 4, 894);
    			attr_dev(p4, "class", "current-data svelte-1s1yday");
    			add_location(p4, file, 37, 4, 960);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t12);
    			append_dev(p4, t13);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.data) && t1_value !== (t1_value = ctx.item.ssid + "")) {
    				set_data_dev(t1, t1_value);
    			}

    			if ((changed.data) && t4_value !== (t4_value = ctx.item.bssid + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((changed.data) && t7_value !== (t7_value = ctx.item.channel + "")) {
    				set_data_dev(t7, t7_value);
    			}

    			if ((changed.data) && t10_value !== (t10_value = ctx.item.signal_level + "")) {
    				set_data_dev(t10, t10_value);
    			}

    			if ((changed.data) && t13_value !== (t13_value = ctx.item.security + "")) {
    				set_data_dev(t13, t13_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p0);
    				detach_dev(t2);
    				detach_dev(p1);
    				detach_dev(t5);
    				detach_dev(p2);
    				detach_dev(t8);
    				detach_dev(p3);
    				detach_dev(t11);
    				detach_dev(p4);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(33:2) {#each data as item}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var div, t0, h2, t1;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			h2 = element("h2");
    			t1 = text(ctx.headerMessage);
    			attr_dev(div, "class", "header-container svelte-1s1yday");
    			add_location(div, file, 31, 0, 654);
    			attr_dev(h2, "class", "header-text svelte-1s1yday");
    			add_location(h2, file, 41, 0, 1032);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.data) {
    				each_value = ctx.data;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.headerMessage) {
    				set_data_dev(t1, ctx.headerMessage);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(t0);
    				detach_dev(h2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { headerMessage = String } = $$props;
      let data = [];

      onMount(async function() {
        const response = await fetch("http://localhost:3000/currentconnection");
        const json = await response.json();
        $$invalidate('data', data = json);
        // console.log(data)
      });

    	const writable_props = ['headerMessage'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<HeaderBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('headerMessage' in $$props) $$invalidate('headerMessage', headerMessage = $$props.headerMessage);
    	};

    	$$self.$capture_state = () => {
    		return { headerMessage, data };
    	};

    	$$self.$inject_state = $$props => {
    		if ('headerMessage' in $$props) $$invalidate('headerMessage', headerMessage = $$props.headerMessage);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    	};

    	return { headerMessage, data };
    }

    class HeaderBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["headerMessage"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "HeaderBar", options, id: create_fragment.name });
    	}

    	get headerMessage() {
    		throw new Error("<HeaderBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerMessage(value) {
    		throw new Error("<HeaderBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Loader.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/components/Loader.svelte";

    function create_fragment$1(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "loader svelte-l9pk5a");
    			add_location(div, file$1, 25, 0, 490);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Loader", options, id: create_fragment$1.name });
    	}
    }

    /* src/components/MiniLoader.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/components/MiniLoader.svelte";

    function create_fragment$2(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "loader svelte-yzyc7c");
    			add_location(div, file$2, 24, 0, 483);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    class MiniLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "MiniLoader", options, id: create_fragment$2.name });
    	}
    }

    /* src/components/Modal.svelte generated by Svelte v3.12.1 */
    const { Object: Object_1 } = globals;

    const file$3 = "src/components/Modal.svelte";

    // (120:0) {#if show}
    function create_if_block(ctx) {
    	var div3, div2, span, t1, div1, h3, t3, h4, t4_value = ctx.selected.ssid + "", t4, t5, p, t7, div0, i, i_class_value, t8, input, t9, button, current_block_type_index, if_block, button_class_value, current, dispose;

    	var if_block_creators = [
    		create_if_block_1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (!ctx.connecting) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			span = element("span");
    			span.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "You are attempting to connect to:";
    			t3 = space();
    			h4 = element("h4");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			p.textContent = "Please enter a password and click connect";
    			t7 = space();
    			div0 = element("div");
    			i = element("i");
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			button = element("button");
    			if_block.c();
    			attr_dev(span, "class", "close svelte-ucoama");
    			add_location(span, file$3, 122, 6, 2557);
    			add_location(h3, file$3, 124, 8, 2658);
    			add_location(h4, file$3, 125, 8, 2709);
    			add_location(p, file$3, 126, 8, 2742);
    			attr_dev(i, "class", i_class_value = "" + null_to_empty((`fas ${ctx.openOrClosed} icon`)) + " svelte-ucoama");
    			add_location(i, file$3, 128, 10, 2839);
    			attr_dev(input, "class", "input-field svelte-ucoama");
    			attr_dev(input, "type", ctx.showPass);
    			attr_dev(input, "placeholder", "password");
    			attr_dev(input, "name", "usrname");
    			add_location(input, file$3, 129, 10, 2914);
    			attr_dev(div0, "class", "input-container svelte-ucoama");
    			add_location(div0, file$3, 127, 8, 2799);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.active) + " svelte-ucoama");
    			add_location(button, file$3, 136, 8, 3104);
    			attr_dev(div1, "class", "connect-content svelte-ucoama");
    			add_location(div1, file$3, 123, 6, 2620);
    			attr_dev(div2, "class", "modal-content svelte-ucoama");
    			add_location(div2, file$3, 121, 4, 2523);
    			attr_dev(div3, "id", "myModal");
    			attr_dev(div3, "class", "modal svelte-ucoama");
    			add_location(div3, file$3, 120, 2, 2486);

    			dispose = [
    				listen_dev(span, "click", ctx.closeModal),
    				listen_dev(i, "click", ctx.showPassword),
    				listen_dev(input, "keyup", ctx.getPassword),
    				listen_dev(button, "click", ctx.connectToNetwork)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, span);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t3);
    			append_dev(div1, h4);
    			append_dev(h4, t4);
    			append_dev(div1, t5);
    			append_dev(div1, p);
    			append_dev(div1, t7);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div0, t8);
    			append_dev(div0, input);
    			append_dev(div1, t9);
    			append_dev(div1, button);
    			if_blocks[current_block_type_index].m(button, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.selected) && t4_value !== (t4_value = ctx.selected.ssid + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((!current || changed.openOrClosed) && i_class_value !== (i_class_value = "" + null_to_empty((`fas ${ctx.openOrClosed} icon`)) + " svelte-ucoama")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (!current || changed.showPass) {
    				attr_dev(input, "type", ctx.showPass);
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index !== previous_block_index) {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(button, null);
    			}

    			if ((!current || changed.active) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.active) + " svelte-ucoama")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div3);
    			}

    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(120:0) {#if show}", ctx });
    	return block;
    }

    // (140:10) {:else}
    function create_else_block(ctx) {
    	var current;

    	var miniloader = new MiniLoader({ $$inline: true });

    	const block = {
    		c: function create() {
    			miniloader.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(miniloader, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(miniloader.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(miniloader.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(miniloader, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(140:10) {:else}", ctx });
    	return block;
    }

    // (138:10) {#if !connecting}
    function create_if_block_1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Connect");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(138:10) {#if !connecting}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.show) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
      // Props in modal component
      let { selected = Object, show = Boolean, closeModal = Function } = $$props;

      let connecting = false;
      let openOrClosed = "fa-eye-slash";
      let showPass = "password";
      let active = "btn-deactive";
      let passwordValue = "";
      const showPassword = () => {
        openOrClosed === "fa-eye-slash"
          ? ($$invalidate('openOrClosed', openOrClosed = "fa-eye"))
          : ($$invalidate('openOrClosed', openOrClosed = "fa-eye-slash"));
        showPass === "password" ? ($$invalidate('showPass', showPass = "text")) : ($$invalidate('showPass', showPass = "password"));
      };
      const getPassword = e => {
        passwordValue = e.target.value;
        passwordValue.length > 0 ? ($$invalidate('active', active = "btn")) : ($$invalidate('active', active = "btn-deactive"));
      };
      const connectToNetwork = () => {
        $$invalidate('connecting', connecting = true);
        setTimeout(() => {
          $$invalidate('connecting', connecting = false);
          closeModal();
          $$invalidate('active', active = "btn-deactive");
        }, 3000);
      };

    	const writable_props = ['selected', 'show', 'closeModal'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('show' in $$props) $$invalidate('show', show = $$props.show);
    		if ('closeModal' in $$props) $$invalidate('closeModal', closeModal = $$props.closeModal);
    	};

    	$$self.$capture_state = () => {
    		return { selected, show, closeModal, connecting, openOrClosed, showPass, active, passwordValue };
    	};

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('show' in $$props) $$invalidate('show', show = $$props.show);
    		if ('closeModal' in $$props) $$invalidate('closeModal', closeModal = $$props.closeModal);
    		if ('connecting' in $$props) $$invalidate('connecting', connecting = $$props.connecting);
    		if ('openOrClosed' in $$props) $$invalidate('openOrClosed', openOrClosed = $$props.openOrClosed);
    		if ('showPass' in $$props) $$invalidate('showPass', showPass = $$props.showPass);
    		if ('active' in $$props) $$invalidate('active', active = $$props.active);
    		if ('passwordValue' in $$props) passwordValue = $$props.passwordValue;
    	};

    	return {
    		selected,
    		show,
    		closeModal,
    		connecting,
    		openOrClosed,
    		showPass,
    		active,
    		showPassword,
    		getPassword,
    		connectToNetwork
    	};
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$3, safe_not_equal, ["selected", "show", "closeModal"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Modal", options, id: create_fragment$3.name });
    	}

    	get selected() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeModal() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeModal(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/NetworksTable.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/components/NetworksTable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.network = list[i];
    	return child_ctx;
    }

    // (58:0) {#if loading}
    function create_if_block_1$1(ctx) {
    	var current;

    	var loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			loader.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(loader, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(loader, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(58:0) {#if loading}", ctx });
    	return block;
    }

    // (62:0) {#if !loading}
    function create_if_block$1(ctx) {
    	var table, thead, tr, th0, t1, th1, t3, th2, t5, th3, t7, tbody;

    	let each_value = ctx.networks;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "SSID";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "BSSID";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Channel";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Security";
    			t7 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(th0, "class", "svelte-gzlbw8");
    			add_location(th0, file$4, 65, 8, 1257);
    			attr_dev(th1, "class", "svelte-gzlbw8");
    			add_location(th1, file$4, 66, 8, 1279);
    			attr_dev(th2, "class", "svelte-gzlbw8");
    			add_location(th2, file$4, 67, 8, 1302);
    			attr_dev(th3, "class", "svelte-gzlbw8");
    			add_location(th3, file$4, 68, 8, 1327);
    			add_location(tr, file$4, 64, 6, 1244);
    			add_location(thead, file$4, 63, 4, 1230);
    			add_location(tbody, file$4, 72, 4, 1375);
    			attr_dev(table, "class", "svelte-gzlbw8");
    			add_location(table, file$4, 62, 2, 1218);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(table, t7);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.networks) {
    				each_value = ctx.networks;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(table);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(62:0) {#if !loading}", ctx });
    	return block;
    }

    // (74:6) {#each networks as network}
    function create_each_block$1(ctx) {
    	var tr, td0, t0_value = ctx.network.ssid + "", t0, t1, td1, t2_value = ctx.network.bssid + "", t2, t3, td2, t4_value = ctx.network.channel + "", t4, t5, td3, t6_value = ctx.network.security + "", t6, t7, dispose;

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(td0, "class", "svelte-gzlbw8");
    			add_location(td0, file$4, 75, 10, 1491);
    			attr_dev(td1, "class", "svelte-gzlbw8");
    			add_location(td1, file$4, 76, 10, 1525);
    			attr_dev(td2, "class", "svelte-gzlbw8");
    			add_location(td2, file$4, 77, 10, 1560);
    			attr_dev(td3, "class", "svelte-gzlbw8");
    			add_location(td3, file$4, 78, 10, 1597);
    			attr_dev(tr, "class", "table-row svelte-gzlbw8");
    			add_location(tr, file$4, 74, 8, 1425);
    			dispose = listen_dev(tr, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.networks) && t0_value !== (t0_value = ctx.network.ssid + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.networks) && t2_value !== (t2_value = ctx.network.bssid + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((changed.networks) && t4_value !== (t4_value = ctx.network.channel + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((changed.networks) && t6_value !== (t6_value = ctx.network.security + "")) {
    				set_data_dev(t6, t6_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(tr);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(74:6) {#each networks as network}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var t0, t1, if_block1_anchor, current;

    	var modal = new Modal({
    		props: {
    		selected: ctx.selected,
    		show: ctx.showModal,
    		closeModal: ctx.closeModal
    	},
    		$$inline: true
    	});

    	var if_block0 = (ctx.loading) && create_if_block_1$1(ctx);

    	var if_block1 = (!ctx.loading) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			modal.$$.fragment.c();
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.selected) modal_changes.selected = ctx.selected;
    			if (changed.showModal) modal_changes.show = ctx.showModal;
    			modal.$set(modal_changes);

    			if (ctx.loading) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t1.parentNode, t1);
    				} else transition_in(if_block0, 1);
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (!ctx.loading) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			transition_in(if_block0);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach_dev(if_block1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let networks = [];
      let loading = true;
      let selected = {};
      let showModal = false;

      onMount(async function() {
        const response = await fetch("http://localhost:3000/networkscanone");
        const json = await response.json();
        $$invalidate('networks', networks = json);
        $$invalidate('loading', loading = false);
      });

      const getInfo = network => {
        $$invalidate('selected', selected = network);
        showModal === false ? ($$invalidate('showModal', showModal = true)) : ($$invalidate('showModal', showModal = false));
      };

      const closeModal = () =>
        showModal === false ? ($$invalidate('showModal', showModal = true)) : ($$invalidate('showModal', showModal = false));

    	const click_handler = ({ network }, e) => getInfo(network);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('networks' in $$props) $$invalidate('networks', networks = $$props.networks);
    		if ('loading' in $$props) $$invalidate('loading', loading = $$props.loading);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('showModal' in $$props) $$invalidate('showModal', showModal = $$props.showModal);
    	};

    	return {
    		networks,
    		loading,
    		selected,
    		showModal,
    		getInfo,
    		closeModal,
    		click_handler
    	};
    }

    class NetworksTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NetworksTable", options, id: create_fragment$4.name });
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$5(ctx) {
    	var t, current;

    	var headerbar = new HeaderBar({
    		props: { headerMessage: "Wi-Finder" },
    		$$inline: true
    	});

    	var networkstable = new NetworksTable({ $$inline: true });

    	const block = {
    		c: function create() {
    			headerbar.$$.fragment.c();
    			t = space();
    			networkstable.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(headerbar, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(networkstable, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(headerbar.$$.fragment, local);

    			transition_in(networkstable.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(headerbar.$$.fragment, local);
    			transition_out(networkstable.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(headerbar, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(networkstable, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	
    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { name };
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$5, safe_not_equal, ["name"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$5.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
