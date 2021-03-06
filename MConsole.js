/**
 * MConsole.js
 * @Author ---- CJY
 * @Date ------ 2016.11.11
 */

(function() {
	var root = this;
	var __CanGetLogInfo;
	if (Error.captureStackTrace) {
		Object.defineProperty(window, '__Stack', {
			get: function() {
				var orig = Error.prepareStackTrace;
				Error.prepareStackTrace = function(_, stack) {
					return stack;
				};
				var err = new Error;
				Error.captureStackTrace(err, arguments.callee);
				var stack = err.stack;
				Error.prepareStackTrace = orig;
				return stack[1];
			}
		});
		__CanGetLogInfo = false;
	} else {
		__CanGetLogInfo = true;
	}
	function MConsole() {
		var self = this;
		(function() {
			self.Body = null;
			self.Container = null;
			self.Button = null;
			self.ScrollingFlag = false;
			self.ScrollingTimeout = null;
			self.LineNumber = null;
			self.FileName = null;
			self.PreMsg = null;
			self.RunHisory = JSON.parse(window.localStorage.getItem('__MConsole__RunHistory') || '[]');
			self.RunHisoryIdx = -1;
			self.initFlag = false;
			self.init = function() {
				if (self.initFlag) return;
				self.initFlag = true;
				self.build();
				__rewriteConsoleFunction();
				window.onerror = function(eMsg, eUrl, eLine) {
					self.LineNumber = eLine;
					self.FileName = eUrl.split('/').reverse()[0].split('?')[0];
					self.error(eMsg);
				};
			};
			self.build = function() {
				var $Console = document.createElement('div');
				$Console.id = 'MConsole';
				$Console.innerHTML = [
					'<div id="MConsole-Title">MConsole</div>',
					'<div id="MConsole-Log-Container"></div>',
					'<div id="MConsole-Run">',
						'<button id="MConsole-Run-Btn">RUN</button>',
						'<input type="text">',
						'<div class="MConsole-Run-Right">',
							'<button id="MConsolt-Run-Prev"></button>',
							'<button id="MConsolt-Run-Next"></button>',
						'</div>',
					'</div>'
				].join('');
				var $Container = $Console.querySelector('#MConsole-Log-Container');
				var $Button = document.createElement('button');
				$Button.id = 'MConsoleButton';
				$Button.innerHTML = 'C';
				self.Body = $Console;
				self.Container = $Container;
				self.Button = $Button;
				__initEvent($Console, $Button);
				document.body.appendChild($Button);
				document.body.appendChild($Console);
			};
			self.run = function(code) {
				var codeHisoryIdx = self.RunHisory.indexOf(code);
				if (codeHisoryIdx !== -1) self.RunHisory.splice(codeHisoryIdx, 1);
				self.RunHisory.unshift(code);
				if (self.RunHisory.length > 100) self.RunHisory.pop();
				self.RunHisoryIdx = -1;
				window.localStorage.setItem('__MConsole__RunHistory', JSON.stringify(self.RunHisory));
				try {console.log(eval.call(window, code));}
				catch (e) {console.error(e);}
			};
			self.log = function() {
				var $Msg = document.createElement('p');

				$Msg.className = 'MConsole-Log active';
				$Msg.innerHTML = [
					'<span class="MConsole-Log-Count">1</span>',
					'<span class="MConsole-Log-Content"></span>',
					'<span class="MConsole-Line-Info">' + self.FileName + ': ' + self.LineNumber + '</span>',
				].join('');

				var Html = [''],
					Container = self.Container;

				self.LineNumber = null;
				self.FileName = null;

				for (var i in arguments) {
					if (__typeof(arguments[i]) === 'Number') {
						arguments[i] = '<span class="MConsole-Type-Number">' + arguments[i] + '</span>';
					} else if (__typeof(arguments[i]) === 'Boolean') {
						arguments[i] = '<span class="MConsole-Type-Boolean">' + arguments[i] + '</span>';
					} else if (__typeof(arguments[i]) === 'Array') {
						arguments[i] = '<span class="MConsole-Type-Normal">Array: ' + JSON.stringify(arguments[i]) + '</span>';
					} else if (__typeof(arguments[i]) === 'Object') {
						arguments[i] = '<span class="MConsole-Type-Normal">Object: ' + JSON.stringify(arguments[i]) + '</span>';
					} else if (__typeof(arguments[i]) === 'Undefined') {
						arguments[i] = '<span class="MConsole-Type-Undefined">' + arguments[i] + '</span>';
					} else if (__typeof(arguments[i]) === 'Error') {
						arguments[i] = '<span class="MConsole-Type-Normal">' + arguments[i] + '</span>';
					} else if (true) {
						arguments[i] = '<span class="MConsole-Type-Normal">' + arguments[i] + '</span>';
					}
					Html.push(arguments[i]);
				}

				var content = Html.join('  ');

				//------------------------------------- 处理条计数 -------------------------------------
				if (self.PreMsg && content === self.PreMsg.querySelector('.MConsole-Log-Content').innerHTML) {
					var $PreMsgCount = self.PreMsg.querySelector('.MConsole-Log-Count');
					$PreMsgCount.classList.remove('MConsole-Info-Icon');
					var count = parseInt($PreMsgCount.innerHTML, 10) || 1;
					count++;
					$PreMsgCount.innerHTML = count;
					$PreMsgCount.classList.add('show');
				} else {
					$Msg.querySelector('.MConsole-Log-Content').innerHTML = content;
					self.PreMsg = $Msg;
					$Msg.addEventListener('click', function() {
						$Msg.classList[$Msg.classList.contains('active') ? 'remove' : 'add']('active');
					});
					Container.appendChild($Msg);
					setTimeout(function() {
						$Msg.classList.remove('active');
					}, 3000);
				}
				//--------------------------------------------------------------------------------------

				if (!self.ScrollingFlag && !Container.querySelector('.active')) {
					Container.scrollTop = Container.scrollHeight;
				}

				return $Msg;
			};
			self.info = __extendLog('Info', 'i');
			self.warn = __extendLog('Warn', '!');
			self.error = __extendLog('Error', 'x');
		})();

		function __extendLog(logName, logIcon) {
			return function() {
				var $Msg = self.log.apply(self, arguments);
				var $MsgCount = $Msg.querySelector('.MConsole-Log-Count');
				$Msg.querySelector('.MConsole-Line-Info').classList.add('MConsole-' + logName + '-Line-Info');
				$Msg.classList.add('MConsole-' + logName);
				$MsgCount.innerHTML = ' ' + logIcon + ' ';
				$MsgCount.classList.add('MConsole-' + logName + '-Icon');
				$MsgCount.classList.add('show');
			}
		}
		function __initEvent($Console, $Button) {
			$Button.addEventListener('click', function() {
				var display = $Console.style.display;
				$Console.style.display = !display || display === 'none' ? 'block' : 'none';
			});
			//---------------------- Run_Event Start -----------------------------
			var $Run_Button = $Console.querySelector('#MConsole-Run-Btn'),
				$Run_Input = $Console.querySelector('#MConsole-Run input');
			$Run_Button.addEventListener('click', function() {
				self.run($Run_Input.value);
				$Run_Input.value = '';
			});
			$Run_Input.addEventListener('keyup', function(e) {
				if (e.keyCode === 13) {
					self.run($Run_Input.value);
					$Run_Input.value = '';
				}
			});
			var $Run_History_Prev = $Console.querySelector('#MConsolt-Run-Prev'),
				$Run_History_Next = $Console.querySelector('#MConsolt-Run-Next');
			$Run_History_Prev.addEventListener('click', function() {				
				if (self.RunHisoryIdx < self.RunHisory.length - 1) {
					self.RunHisoryIdx += 1;
					$Run_Input.value = self.RunHisory[self.RunHisoryIdx];
				}
			});
			$Run_History_Next.addEventListener('click', function() {				
				if (self.RunHisoryIdx > -1) {
					self.RunHisoryIdx -= 1;
					$Run_Input.value = self.RunHisoryIdx === -1 ? '' : self.RunHisory[self.RunHisoryIdx];
				}
			});
			//---------------------- Run_Event End -----------------------------
			//------------------- Console_Event Start --------------------------
			$Console.addEventListener('touchstart', $Console_Event_Handler);
			$Console.addEventListener('touchmove', $Console_Event_Handler);
			function $Console_Event_Handler() {
				clearTimeout(self.ScrollingTimeout);
				self.ScrollingFlag = true;
				self.ScrollingTimeout = setTimeout(function() {
					self.ScrollingFlag = false;
				}, 5000);
			}
			//-------------------- Console_Event End ---------------------------
		}
		//重写console方法
		function __rewriteConsoleFunction() {
			var console = window.console;
			console._log = console.log;
			console.log = function() {
				if (__CanGetLogInfo) {
					self.LineNumber = '*';
					self.FileName = '*';
				} else {
					self.LineNumber = __Stack.getLineNumber();
					self.FileName = __Stack.getFileName().split('/').reverse()[0].split('?')[0];
				}
				self.log.apply(self, arguments);
				console._log.apply(console, arguments);
			};
			console._info = console.info;
			console.info = function() {
				if (__CanGetLogInfo) {
					self.LineNumber = '*';
					self.FileName = '*';
				} else {
					self.LineNumber = __Stack.getLineNumber();
					self.FileName = __Stack.getFileName().split('/').reverse()[0].split('?')[0];
				}
				self.info.apply(self, arguments);
				console._info.apply(console, arguments);
			};
			console._warn = console.warn;
			console.warn = function() {
				if (__CanGetLogInfo) {
					self.LineNumber = '*';
					self.FileName = '*';
				} else {
					self.LineNumber = __Stack.getLineNumber();
					self.FileName = __Stack.getFileName().split('/').reverse()[0].split('?')[0];
				}
				self.warn.apply(self, arguments);
				console._warn.apply(console, arguments);
			};
			console._error = console.error;
			console.error = function() {
				if (__CanGetLogInfo) {
					self.LineNumber = '*';
					self.FileName = '*';
				} else {
					self.LineNumber = __Stack.getLineNumber();
					self.FileName = __Stack.getFileName().split('/').reverse()[0].split('?')[0];
				}
				self.error.apply(self, arguments);
				console._error.apply(console, arguments);
			};
		}
		function __typeof(val) { return {}.toString.call(val).replace('[object ', '').replace(']', '');}
	}
	if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) exports = module.exports = new MConsole();
        exports.MConsole = new MConsole();
    } else if (typeof define !== 'undefined') {
    	define(new MConsole());
    } else root.MConsole = new MConsole();
}.call(this));
