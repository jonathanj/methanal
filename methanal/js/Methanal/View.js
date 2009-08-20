// import Nevow.Athena
// import Mantissa
// import Divmod
// import Methanal.Util


Methanal.View._Handler = Divmod.Class.subclass('Methanal.View._Handler');
Methanal.View._Handler.methods(
    function __init__(self, handlerId, cache, fn, inputs, outputs) {
        self.handlerId = handlerId;
        self.cache = cache;
        self.fn = fn;
        self.inputs = inputs;
        self.outputs = outputs;
    },

    function update(self) {
        var values = [];
        for (var j = 0; j < self.inputs.length; ++j) {
            var value = self.cache.getData(self.inputs[j]);
            values.push(value);
        }
        self.value = self.fn.apply(null, values);
    });


Methanal.View.HandlerError = Divmod.Error.subclass('Methanal.View.HandlerError');
Methanal.View.HandlerError.methods(
    function toString(self) {
        return 'HandlerError: ' + self.message;
    });


Methanal.View.MissingControlError = Divmod.Error.subclass('Methanal.View.MissingControlError');
Methanal.View.MissingControlError.methods(
    function toString(self) {
        return 'MissingControlError: ' + self.message;
    });


Methanal.View._HandlerCache = Divmod.Class.subclass('Methanal.View._HandlerCache');
Methanal.View._HandlerCache.methods(
    function __init__(self, getData, update) {
        self.getData = getData;
        self.update = update;
        self.inputToHandlers = {};
        self.outputToHandlers = {};
        self.handlers = {};
        self.handlerId = 0;
    },

    function addHandler(self, fn, inputs, outputs) {
        if (fn === undefined)
            throw Methanal.View.HandlerError('Specified handler function is not defined');

        var handler = Methanal.View._Handler(self.handlerId, self, fn, inputs, outputs);

        for (var i = 0; i < inputs.length; ++i) {
            var input = inputs[i];
            var handlers = self.inputToHandlers[input];
            if (handlers === undefined) {
                handlers = self.inputToHandlers[input] = {};
            }
            handlers[self.handlerId] = 1;
        }

        for (var i = 0; i < outputs.length; ++i) {
            var output = outputs[i];
            var handlers = self.outputToHandlers[output];
            if (handlers === undefined) {
                handlers = self.outputToHandlers[output] = {};
            }
            handlers[self.handlerId] = 1;
        }

        self.handlers[self.handlerId] = handler;
        self.handlerId += 1;
    },

    function refresh(self, outputs) {
        for (var handlerId in self.handlers) {
            self.handlers[handlerId].update();
        }

        self.updateOutputs(outputs);
    },

    function updateOutputs(self, outputs) {
        for (var output in outputs) {
            var results = [];
            for (var handlerId in self.outputToHandlers[output]) {
                var handler = self.handlers[handlerId];
                results.push(handler.value);
            }
            if (results.length > 0) {
                self.update(output, results);
            }
        }
    },

    function changed(self, input) {
        var handlers = self.inputToHandlers[input];
        var outputs = {};
        for (var handlerId in handlers) {
            var handler = self.handlers[handlerId];
            handler.update();
            for (var i = 0; i < handler.outputs.length; ++i) {
                outputs[handler.outputs[i]] = 1;
            }
        }

        self.updateOutputs(outputs);
    });


Methanal.View.FormBehaviour = Nevow.Athena.Widget.subclass('Methanal.View.FormBehaviour');
Methanal.View.FormBehaviour.methods(
    function formInit(self) {
        self.controls = {};
        self.subforms = {};
        self.validatorCache = Methanal.View._HandlerCache(
            function _getData(name) {
                return self.getControl(name).getValue();
            },
            function _update(name, values) {
                var control = self.getControl(name);
                if (control.active) {
                    for (var i = 0; i < values.length; ++i) {
                        var value = values[i];
                        if (value) {
                            control.setError(value);
                            return;
                        }
                    }
                }
                control.clearError();
            });

        self.depCache = Methanal.View._HandlerCache(
            function _getData(name) {
                return self.getControl(name).getValue();
            },
            function _update(name, values) {
                function _and(x, y) {
                    return x && y;
                };

                var control = self.getControl(name);
                result = Methanal.Util.reduce(_and, values, true);
                control.setActive(result);
            });

        self.fullyLoaded = false;
    },

    function loadedUp(self, control) {
        if (self.fullyLoaded) {
            Divmod.msg('XXX: Control reported in after all controls were supposedly loaded!');
            return;
        }

        delete self.controlNames[control.name];
        for (var name in self.controlNames) {
            return;
        }

        self.fullyLoaded = true;

        for (var name in self.depCache.inputToHandlers) {
            var node = self.getControl(name).widgetParent.node;
            Methanal.Util.addElementClass(node, 'dependancy-parent');
            node.title = 'Other fields depend on this field';
        }

        self.depCache.refresh(self.controls);
        self.validatorCache.refresh(self.controls);
        self.refreshValidity();
    },

    function getControl(self, controlName) {
        var control = self.controls[controlName];
        if (control === undefined) {
            throw Methanal.View.MissingControlError(controlName);
        }
        return control;
    },

    function addValidator(self, controls, fns) {
        for (var i = 0; i < fns.length; ++i) {
            self.validatorCache.addHandler(fns[i], controls, controls);
        }
    },

    function addValidators(self, validators) {
        for (var i = 0; i < validators.length; ++i) {
            var controls = validators[i][0];
            var fns = validators[i][1];
            self.addValidator(controls, fns);
        }
    },

    function valueChanged(self, control) {
        self.checkDeps(control);
        self.validate(control);
    },

    function validate(self, control) {
        self.validatorCache.changed(control.name);
        self.refreshValidity();
    },

    function refreshValidity(self) {
        self.setValid();

        for (var controlName in self.controls) {
            var control = self.getControl(controlName);
            if (control.active && control.error) {
                self.setInvalid();
                return;
            }
        }

        for (var name in self.subforms) {
            if (!self.subforms[name].valid) {
                self.setInvalid();
                return;
            }
        }
    },

    function addDepCheckers(self, checkers) {
        for (var i = 0; i < checkers.length; ++i) {
            var checkerInfo = checkers[i];
            var inputControls = checkerInfo[0];
            var outputControls = checkerInfo[1];
            var checker = checkerInfo[2];
            self.depCache.addHandler(checker, inputControls, outputControls);
        }
    },

    function checkDeps(self, control) {
        self.depCache.changed(control.name);
    });


Methanal.View.LiveForm = Methanal.View.FormBehaviour.subclass('Methanal.View.LiveForm');
Methanal.View.LiveForm.methods(
    function __init__(self, node, viewOnly, controlNames) {
        Methanal.View.LiveForm.upcall(self, '__init__', node);
        self.viewOnly = viewOnly;
        self.controlNames = controlNames;
        self.formInit();
    },

    function getForm(self) {
        return self;
    },

    function nodeInserted(self) {
        self.formErrorNode = self.nodeById('form-error');
        if (!self.viewOnly) {
            self.submitNode = self.nodeById('submit');
        }
        self.throbberNode = self.nodeById('throbber');
    },

    function submit(self) {
        var data = {};
        for (var name in self.controls) {
            var input = self.getControl(name);
            data[input.name] = input.active ? input.getValue() : null;
        }
        for (var name in self.subforms) {
            var form = self.subforms[name];
            data[form.name] = form.getValue();
        }

        Methanal.Util.replaceNodeText(self.formErrorNode, '');
        self.disableSubmit();
        self.enableThrobber();

        var d = self.callRemote('invoke', data);
        d.addCallback(function (value) {
            self.disableThrobber();
            self.enableSubmit();
            return self.submitSuccess(value);
        });
        d.addErrback(function (value) {
            self.disableThrobber();
            self.enableSubmit();
            return self.submitFailure(value);
        });
        return d;
    },

    function submitSuccess(self, value) {
    },

    function submitFailure(self, value) {
        Methanal.Util.replaceNodeText(self.formErrorNode, Methanal.Util.formatFailure(value));
    },

    function enableThrobber(self) {
        self.throbberNode.style.visibility = 'visible';
    },

    function disableThrobber(self) {
        self.throbberNode.style.visibility = 'hidden';
    },

    function enableSubmit(self) {
        if (self.viewOnly) {
            return;
        }
        var node = self.submitNode;
        node.disabled = false;
        Methanal.Util.removeElementClass(node, 'methanal-submit-disabled');
    },

    function disableSubmit(self) {
        if (self.viewOnly) {
            return;
        }
        var node = self.submitNode;
        node.disabled = true;
        Methanal.Util.addElementClass(node, 'methanal-submit-disabled');
    },

    function handleSubmit(self) {
        if (self.viewOnly) {
            return false;
        }
        self.submit();
        return false;
    },

    function setValid(self) {
        self.enableSubmit();
    },

    function setInvalid(self) {
        self.disableSubmit();
    });


Methanal.View.InputContainer = Nevow.Athena.Widget.subclass('Methanal.View.InputContainer');
Methanal.View.InputContainer.methods(
    function getForm(self) {
        return self.widgetParent.getForm();
    },

    function setError(self, error) {
        Methanal.Util.addElementClass(self.node, 'methanal-control-error');
    },

    function checkForErrors(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var childWidget = self.childWidgets[i];
            if (childWidget.error !== null && childWidget.error !== undefined) {
                self.setError(childWidget.error);
                return;
            }
        }

        self.clearError();
    },

    function clearError(self) {
        Methanal.Util.removeElementClass(self.node, 'methanal-control-error');
    },

    function setActive(self, active) {
        self.node.style.display = active ? 'block' : 'none';
        Methanal.Util.addElementClass(self.node, 'dependancy-child');
    },

    function checkActive(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var childWidget = self.childWidgets[i];
            if (childWidget.active) {
                self.setActive(true);
                return;
            }
        }

        self.setActive(false);
    });


Methanal.View.FormRow = Methanal.View.InputContainer.subclass('Methanal.View.FormRow');
Methanal.View.FormRow.methods(
    function __init__(self, node) {
        Methanal.View.InputContainer.upcall(self, '__init__', node);
    },

    function nodeInserted(self) {
        self.errorTextNode = self.nodeById('error-text');
    },

    function setError(self, error) {
        Methanal.View.FormRow.upcall(self, 'setError', error);
        Methanal.Util.replaceNodeText(self.errorTextNode, error);
    },

    function clearError(self) {
        Methanal.View.FormRow.upcall(self, 'clearError');
        Methanal.Util.replaceNodeText(self.errorTextNode, '');
    });


Methanal.View.SimpleForm = Methanal.View.LiveForm.subclass('Methanal.View.SimpleForm');
Methanal.View.SimpleForm.methods(
    function __init__(self, node, controlNames) {
        Methanal.View.SimpleForm.upcall(self, '__init__', node, true, controlNames);
    },

    function nodeInserted(self) {
    },

    function getContainer(self) {
        return self.widgetParent;
    },

    function setValid(self) {
        self.getContainer().clearError();
    },

    function setInvalid(self) {
        self.getContainer().setError('');
    });


Methanal.View.GroupInput = Methanal.View.FormBehaviour.subclass('Methanal.View.GroupInput');
Methanal.View.GroupInput.methods(
    function __init__(self, node, name, controlNames) {
        Methanal.View.GroupInput.upcall(self, '__init__', node);
        self.formInit();
        self.name = name;
        self.setValid();
        self.controlNames = controlNames;
    },

    function getForm(self) {
        return self;
    },

    function setWidgetParent(self, widgetParent) {
        Methanal.View.GroupInput.upcall(self, 'setWidgetParent', widgetParent);
        if (self.widgetParent) {
            self.widgetParent.getForm().subforms[self.name] = self;
        }
    },

    function clearError(self) {
    },

    function setError(self, error) {
    },

    function setValue(self, value) {
    },

    function getValue(self) {
        var data = {};
        for (var name in self.controls) {
            var input = self.getControl(name);
            data[input.name] = input.active ? input.getValue() : null;
        }
        for (var name in self.subforms) {
            var form = self.subforms[name];
            data[form.name] = form.getValue();
        }
        return data;
    },

    function validate(self, control) {
        Methanal.View.GroupInput.upcall(self, 'validate', control);
        self.widgetParent.getForm().validate(control);
    },

    function setValid(self) {
        self.valid = true;
    },

    function setInvalid(self) {
        self.valid = false;
    });


Methanal.View.FormInput = Nevow.Athena.Widget.subclass('Methanal.View.FormInput');
Methanal.View.FormInput.methods(
    function __init__(self, node, args) {
        Methanal.View.FormInput.upcall(self, '__init__', node);
        self.name = args.name;
        self._initialValue = args.value;
        self.label = args.label;

        self.active = true;
        self.inserted = false;
        self.error = null;
    },

    function nodeInserted(self) {
        self.inserted = true;
        self.inputNode = self.getInputNode();
        self.errorNode = self.nodeById('error');
        self.setValue(self._initialValue);

        var form = self.getForm();
        form.controls[self.name] = self;
        form.addValidator([self.name], [(function _baseValidator(value) { return self.baseValidator(value); })]);
        form.loadedUp(self);
    },

    function getForm(self) {
        return self.widgetParent.getForm();
    },

    function getInputNode(self) {
        return self.node.getElementsByTagName('input')[0];
    },

    function setError(self, error) {
        Methanal.Util.addElementClass(self.node, 'methanal-control-error');
        var node = self.errorNode;
        Methanal.Util.replaceNodeText(node, '\xa0');
        error = self.label + ': ' + error;
        node.title = error;
        node.style.display = 'block';
        self.error = error;
        self.widgetParent.checkForErrors();
    },

    function clearError(self) {
        Methanal.Util.removeElementClass(self.node, 'methanal-control-error');
        var node = self.errorNode;
        Methanal.Util.replaceNodeText(node, '');
        node.style.display = 'none';
        self.error = null;
        self.widgetParent.checkForErrors();
    },

    function setActive(self, active) {
        self.active = active;
        self.node.style.display = active ? 'block' : 'none';
        self.widgetParent.checkActive();
        self.getForm().validate(self);
    },

    function setValue(self, value) {
        self.inputNode.value = value;
    },

    function getValue(self) {
        return self.inputNode.value;
    },

    function onChange(self, node) {
        self.getForm().valueChanged(self);
        return true;
    },

    function baseValidator(self, value) {
    });


Methanal.View.TextAreaInput = Methanal.View.FormInput.subclass('Methanal.View.TextAreaInput');
Methanal.View.TextAreaInput.methods(
    function setValue(self, value) {
        self.inputNode.value = value === null ? '' : value;
    },

    function getInputNode(self) {
        return self.node.getElementsByTagName('textarea')[0];
    });


Methanal.View.VerifiedPasswordInput = Methanal.View.FormInput.subclass('Methanal.View.VerifiedPasswordInput');
Methanal.View.VerifiedPasswordInput.methods(
    function nodeInserted(self) {
        Methanal.View.VerifiedPasswordInput.upcall(self, 'nodeInserted');
        self.confirmPasswordNode = self.nodeById('confirmPassword');
    },

    function passwordIsStrong(self, password) {
        return password.length > 4;
    },

    function baseValidator(self, value) {
        if (value !== self.confirmPasswordNode.value || value === null || self.confirmPasswordNode.value === null)
            return 'Passwords do not match.';

        if (!self.passwordIsStrong(value))
            return 'Password is too weak.';
    });


Methanal.View.SlugInput = Methanal.View.FormInput.subclass('Methanal.View.SlugInput');
Methanal.View.SlugInput.methods(
        function baseValidator(self, value) {
            var regex = /^[a-z0-9\-]*$/;
            if (!regex.test(value))
                return 'Must consist of lowercase letters, digits, and hyphens';
        },

        function onKeyUp(self, node) {
            node.value = Methanal.Util.slugify(node.value);
        });


Methanal.View.SlugifyingInput = Methanal.View.FormInput.subclass('Methanal.View.SlugifyingInput');
Methanal.View.SlugifyingInput.methods(
        function __init__(self, node, args) {
            Methanal.View.SlugifyingInput.upcall(self, '__init__', node, args);
            self.slugInputName = args.slugInputName;
        },

        function getSlugInput(self) {
            return self.getForm().getControl(self.slugInputName);
        },
        
        function onKeyUp(self, node) {
            self.getSlugInput().setValue(Methanal.Util.slugify(node.value));
        },
        
        function onChange(self, node) {
            Methanal.View.SlugifyingInput.upcall(self, 'onChange', node);
            var slugInput = self.getSlugInput();
            slugInput.setValue(Methanal.Util.slugify(node.value));
            slugInput.onChange(slugInput.node);
        });


Methanal.View.TextInput = Methanal.View.FormInput.subclass('Methanal.View.TextInput');
Methanal.View.TextInput.methods(
    function __init__(self, node, args) {
        Methanal.View.TextInput.upcall(self, '__init__', node, args);
        self.embeddedLabel = args.embeddedLabel;
    },

    function valueNeedsLabel(self, value) {
        return self.embeddedLabel && (value === null || value.length === 0);
    },

    function setValue(self, value) {
        if (self.valueNeedsLabel(value)) {
            self.setLabel(self.inputNode);
        } else {
            self.unsetLabel(self.inputNode);
            self.inputNode.value = value === null ? '' : value;
        }
    },

    function getValue(self) {
        if (self.labelled)
            return '';

        return Methanal.View.TextInput.upcall(self, 'getValue');
    },

    function setLabel(self, node) {
        node.value = self.label;
        Methanal.Util.addElementClass(node, 'embedded-label');
        self.labelled = true;
    },

    function unsetLabel(self, node) {
        Methanal.Util.removeElementClass(node, 'embedded-label');
        self.labelled = false;
    },

    function onBlur(self, node) {
        var value = node.value;
        if (self.embeddedLabel) {
            self.destroyTooltip();
            if (self.valueNeedsLabel(value)) {
                self.setLabel(node);
                self.onChange(node);
            } else {
                self.unsetLabel(node);
            }
        }
    },

    function createTooltip(self) {
        var nodes = self.nodesByAttribute('className', 'tooltip');
        if (nodes.length == 0) {
            var doc = self.node.ownerDocument;
            var div = doc.createElement('div');
            var input = self.getInputNode();
            Methanal.Util.replaceNodeText(div, self.label);
            Methanal.Util.addElementClass(div, 'tooltip');
            self.node.appendChild(div);
            self.tooltipNode = div;
        }
    },

    function destroyTooltip(self) {
        if (self.tooltipNode) {
            self.node.removeChild(self.tooltipNode);
            self.tooltipNode = null;
        }
    },

    function onFocus(self, node) {
        if (self.embeddedLabel)
            self.createTooltip();

        if (self.labelled) {
            self.unsetLabel(node);
            node.value = '';
        }
    });


Methanal.View.MultiCheckboxInput = Methanal.View.FormInput.subclass('Methanal.View.MultiCheckboxInput');
Methanal.View.MultiCheckboxInput.methods(
    function getInputNode(self) {
        var inputs = {};
        var nodes = self.node.getElementsByTagName('input');
        for (var i = 0; i < nodes.length; ++i) {
            var node = nodes[i];
            inputs[node.value] = node;
        }
        return inputs;
    },

    function setValue(self, values) {
        // First we turn them all off...
        for (var name in self.inputNode) {
            var node = self.inputNode[name];
            node.checked = false;
        }

        // ...then we turn the selected ones back on
        if (values) {
            for (var i = 0; i < values.length; ++i) {
                var value = values[i];
                var node = self.inputNode[value]
                if (node) {
                    node.checked = true;
                }
            }
        }
    },

    function getValue(self) {
        var values = [];
        for (var name in self.inputNode) {
            var node = self.inputNode[name];
            if (node.checked) {
                values.push(name);
            }
        }
        return values;
    });


Methanal.View.SelectInput = Methanal.View.FormInput.subclass('Methanal.View.SelectInput');
Methanal.View.SelectInput.methods(
    function insertEmbeddedLabel(self, node, labelNode) {
        node.insertBefore(labelNode, node.options[0]);
    },

    function add(self, value, label, before) {
        var node = self.inputNode;
        var doc = node.ownerDocument;
        var optionNode = doc.createElement('option');
        optionNode.value = value;
        optionNode.appendChild(doc.createTextNode(label));

        // If "before" is null then we don't add the node, if it's undefined
        // then we'll append the node otherwise it'll be inserted before
        // "before".
        if (before !== null) {
            before = before === undefined ? null : before;
            node.add(optionNode, before);
        }
        return optionNode;
    },

    function addDummyOption(self) {
        var node = self.inputNode;
        var optionNode = self.add('', self.label, null);
        Methanal.Util.addElementClass(optionNode, 'embedded-label');
        Methanal.Util.addElementClass(node, 'embedded-label');
        self.insertEmbeddedLabel(node, optionNode)
    },

    function setValue(self, value) {
        Methanal.View.SelectInput.upcall(self, 'setValue', value);
        if (value === null) {
            self.addDummyOption();
            self.inputNode.value = '';
        }
    },

    function getValue(self) {
        var value = Methanal.View.SelectInput.upcall(self, 'getValue');
        if (value.length == 0)
            return null;

        return value;
    },

    function onBlur(self, node) {
        if (node.value === '')
            Methanal.Util.addElementClass(node, 'embedded-label');
        self.onChange(node);
    },

    function onFocus(self, node) {
        if (node.value === '')
            Methanal.Util.removeElementClass(node, 'embedded-label');
        self.onChange(node);
    },

    function getInputNode(self) {
        return self.node.getElementsByTagName('select')[0];
    });


Methanal.View.IntegerSelectInput = Methanal.View.SelectInput.subclass('Methanal.View.IntegerSelectInput');
Methanal.View.IntegerSelectInput.methods(
    function getValue(self) {
        var value = Methanal.View.IntegerSelectInput.upcall(self, 'getValue');
        if (value === null || value.length == 0)
            return null;

        return Methanal.Util.strToInt(value);
    });


Methanal.View.MultiSelectInput = Methanal.View.SelectInput.subclass('Methanal.View.MultiSelectInput');
Methanal.View.MultiSelectInput.methods(
    function clearSelection(self, node) {
        var node = self.getInputNode();
        node.selectedIndex = -1;
        self.onChange(node);
        return false;
    },

    function foreachSelected(self, func) {
        var node = self.getInputNode();
        if (node.selectedIndex === -1)
            return null;

        var values = [];
        var options = node.options;
        for (var i = 0; i < options.length; ++i) {
            var item = options.item(i);
            if (item.selected)
                values.push(func(item));
        }

        return values;
    },

    function getSelectedText(self) {
        return self.foreachSelected(function (item) {
            return item.text;
        });
    },

    function getSelectedValues(self) {
        return self.foreachSelected(function (item) {
            return item.value;
        });
    },

    function onChange(self, node) {
        var values = self.getSelectedText();
        var selnode = self.nodeById('selection');
        if (values === null) {
            selnode.style.display = 'none';
        } else {
            selnode.style.display = 'block';
            Methanal.Util.replaceNodeText(selnode, 'Selected ' + values.length.toString() + ' item(s).');
        }

        Methanal.View.MultiSelectInput.upcall(self, 'onChange', node);
    },

    function setValue(self, values) {
        if (values === null)
            return;

        var options = self.getInputNode().options;
        for (var i = 0; i < options.length; ++i) {
            var option = options[i];
            for (var j = 0; j < values.length; ++j) {
                if (option.value === values[j])
                    option.selected = true;
            }
        }
    },

    function getValue(self) {
        return self.getSelectedValues();
    });


Methanal.View.GroupedSelectInput = Methanal.View.SelectInput.subclass('Methanal.View.GroupedSelectInput');
Methanal.View.GroupedSelectInput.methods(
    function insertEmbeddedLabel(self, node, labelNode) {
        node.insertBefore(labelNode, node.getElementsByTagName('optgroup')[0]);
    });


Methanal.View.CheckboxInput = Methanal.View.TextInput.subclass('Methanal.View.CheckboxInput');
Methanal.View.CheckboxInput.methods(
    function getValue(self) {
        return self.inputNode.checked;
    });


/**
 * A form widget for textually entering dates.
 *
 * The following date formats are supported::
 *
 *     YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
 *     DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 *
 * As well as the special inputs "yesterday", "today" and "tomorrow".
 */
Methanal.View.DateInput = Methanal.View.TextInput.subclass('Methanal.View.DateInput');
Methanal.View.DateInput.methods(
    function nodeInserted(self) {
        self.dateReprNode = self.nodeById('date-representation');
        Methanal.View.DateInput.upcall(self, 'nodeInserted');
    },

    function splitDate(self, value) {
        var delims = ['-', '/', '.'];

        for (var i = 0; i < delims.length; ++i) {
            var parts = value.split(delims[i]);
            if (parts.length == 3)
                return parts;
        }

        return null;
    },

    function parseDate(self, value) {
        if (value.length === 0)
            return null;

        var parts = self.splitDate(value);
        if (parts != null) {
            var y;
            var m;
            var d;

            m = Methanal.Util.strToInt(parts[1]) - 1;
            if (parts[0].length == 4) {
                y = Methanal.Util.strToInt(parts[0]);
                d = Methanal.Util.strToInt(parts[2]);
            } else {
                y = Methanal.Util.strToInt(parts[2]);
                d = Methanal.Util.strToInt(parts[0]);
            }

            if (y > 0 && m >= 0 && m < 12 && d > 0 && d < 32)
                return new Date(y, m, d);
        } else {
            var value = value.toLowerCase();
            if (value == 'today')
                return new Date();
            else if (value == 'yesterday')
                return new Date((new Date()).getTime() - 3600 * 24 * 1000);
            else if (value == 'tomorrow')
                return new Date((new Date()).getTime() + 3600 * 24 * 1000);
        }

        return undefined;
    },

    function reprDate(self, value) {
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var r = [];

        r.push(days[value.getDay()] + ',');
        r.push(value.getDate().toString());
        r.push(months[value.getMonth()]);
        r.push(value.getFullYear().toString());

        return r.join(' ');
    },

    function updateRepr(self, node) {
        var dateReprNode = self.dateReprNode;
        var d = self.parseDate(node.value);
        if (d === undefined)
            Methanal.Util.replaceNodeText(dateReprNode, 'Unknown date format');
        else if (d === null)
            Methanal.Util.replaceNodeText(dateReprNode, '');
        else
            Methanal.Util.replaceNodeText(dateReprNode, self.reprDate(d));
    },

    function dateChanged(self, node) {
        self.updateRepr(node);
    },

    function setValue(self, data) {
        Methanal.View.DateInput.upcall(self, 'setValue', data);
        self.updateRepr(self.inputNode);
    },

    function getValue(self) {
        var value = Methanal.View.DateInput.upcall(self, 'getValue');
        var d = self.parseDate(value);
        if (d === null || d === undefined)
            return null;

        return d.getTime();
    },

    function baseValidator(self, value) {
        if (value === undefined)
            return 'Invalid date value';
    });


Methanal.View.DecimalInput = Methanal.View.TextInput.subclass('Methanal.View.DecimalInput');
Methanal.View.DecimalInput.methods(
    function __init__(self, node, args) {
        self.decimalPlaces = args.decimalPlaces;
        self.showRepr = args.showRepr;
        self.minValue = args.minValue;
        self.maxValue = args.maxValue;
        self._regex = '^\\d*(\\.\\d{0,' + self.decimalPlaces.toString() + '})?$';

        Methanal.View.DecimalInput.upcall(self, '__init__', node, args);
    },

    function nodeInserted(self) {
        self.reprNode = self.nodeById('representation');

        Methanal.View.DecimalInput.upcall(self, 'nodeInserted');
        if (!self.showRepr)
            self.reprNode.style.display = 'none';
    },

    function getRepr(self, value) {
        return Methanal.Util.formatDecimal(value.toFixed(self.decimalPlaces));
    },

    function updateRepr(self, node) {
        if (self.showRepr) {
            var reprNode = self.reprNode;
            var v = self.getValue();
            if (v !== null && self.baseValidator(v) === undefined) {
                var repr = self.getRepr(v);
                if (repr !== null && repr !== undefined) {
                    Methanal.Util.replaceNodeText(reprNode, repr);
                    return;
                }
            }

            Methanal.Util.replaceNodeText(reprNode, '');
        }
    },

    function valueChanged(self, node) {
        self.updateRepr(node);
    },

    function setValue(self, value) {
        if (value !== '')
            value = value.toFixed(self.decimalPlaces);
        Methanal.View.DecimalInput.upcall(self, 'setValue', value);
        self.updateRepr(self.inputNode);
    },

    function getValue(self) {
        var value = Methanal.View.DecimalInput.upcall(self, 'getValue');
        if (value === '')
            return null;

        if (value.match(self._regex) === null)
            return undefined;

        return parseFloat(value);
    },

    function validateBounds(self, value) {
        if (self.minValue === null && self.maxValue === null)
            return undefined;
        if (self.minValue !== null && value < self.minValue)
            return 'Value must be greater than or equal to ' + Methanal.Util.formatDecimal(self.minValue)
        else if (self.maxValue !== null && value > self.maxValue)
            return 'Value must be less than or equal to ' + Methanal.Util.formatDecimal(self.maxValue)
    },

    function _validate(self, value) {
        return self.validateBounds(value)
    },

    function baseValidator(self, value) {
        if (value === undefined || isNaN(value))
            return 'Numerical value, to a maximum of ' + self.decimalPlaces.toString() + ' decimal places only';

        var error = self._validate(value);
        if (error !== undefined)
            return error;
    });


Methanal.View.PercentInput = Methanal.View.DecimalInput.subclass('Methanal.View.PercentInput');
Methanal.View.PercentInput.methods(
    function __init__(self, node, args) {
        // The value is represented as fractional percentage, but is displayed (and inputted) as
        // though it were an integer percentage. We don't want two places of non-existant precision.
        args.decimalPlaces = args.decimalPlaces - 2;
        Methanal.View.PercentInput.upcall(self, '__init__', node, args);
        self._regex = '^\\d*(\\.\\d{0,' + self.decimalPlaces.toString() + '})?%?$';
    },

    function getRepr(self, value) {
        return (value * 100).toFixed(self.decimalPlaces) + '%';
    },

    function getValue(self) {
        var value = Methanal.View.PercentInput.upcall(self, 'getValue');
        if (value === undefined || value === null)
            return value;

        return value / 100;
    },

    function setValue(self, value) {
        if (value !== undefined && value !== null)
            value *= 100;
        Methanal.View.PercentInput.upcall(self, 'setValue', value);
    },

    function validateBounds(self, value) {
        if (self.minValue === null && self.maxValue === null)
            return undefined;
        if (self.minValue !== null && value < self.minValue)
            return 'Value must be greater than or equal to ' + (self.minValue * 100) + '%';
        else if (self.maxValue !== null && value > self.maxValue)
            return 'Value must be less than or equal to ' + (self.maxValue * 100) + '%'
    });


Methanal.View.IntegerInput = Methanal.View.DecimalInput.subclass('Methanal.View.IntegerInput');
Methanal.View.IntegerInput.methods(
    function __init__(self, node, args) {
        args.decimalPlaces = 0;
        args.showRepr = false;
        Methanal.View.IntegerInput.upcall(self, '__init__', node, args);
        self._regex = '^\\d*$';
    },

    function baseValidator(self, value) {
        if (value === undefined || isNaN(value))
            return 'Numerical value only';
    });
