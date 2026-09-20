#compdef rdoc
# zsh completion for rdoc
# Install: fpath+=("$PWD/completions"); autoload -Uz compinit && compinit
# Or: source completions/rdoc.zsh after renaming/copying into a fpath dir as _rdoc

_rdoc() {
  local -a commands
  commands=(
    'build:Compile Markdown to .rdoc / .rdoc.html'
    'inspect:Show manifest, size, hash, reading time'
    'validate:Validate document (CI-friendly exit codes)'
    'serve:Local HTTP preview'
    'open:Open in browser'
    'associate:Register or remove OS file association'
    'init:Write demo fixture'
  )

  local context state state_descr line
  typeset -A opt_args

  _arguments -C \
    '(-h --help)'{-h,--help}'[Show help]' \
    '(-V --version)'{-V,--version}'[Show version]' \
    '1: :->cmds' \
    '*:: :->args'

  case $state in
    cmds)
      _describe -t commands 'rdoc command' commands
      ;;
    args)
      case $words[1] in
        build)
          _arguments \
            '(-o --output)'{-o,--output}'[Output file]:file:_files' \
            '(-t --title)'{-t,--title}'[Document title]:title:' \
            '(-a --author)'{-a,--author}'[Author]:author:' \
            '(-l --lang)'{-l,--lang}'[Language BCP 47]:lang:' \
            '(-d --description)'{-d,--description}'[Short description]:text:' \
            '(-w --watch)'{-w,--watch}'[Watch and rebuild]' \
            '1:input markdown:_files -g "*.md"'
          ;;
        inspect|validate|open)
          _arguments '1:file:_files'
          ;;
        serve)
          _arguments \
            '(-p --port)'{-p,--port}'[Port]:port:' \
            '1:file:_files'
          ;;
        associate)
          _arguments '--undo[Remove association]'
          ;;
        init)
          _arguments \
            '(-o --output)'{-o,--output}'[Output path]:file:_files' \
            '1:what:(demo)'
          ;;
      esac
      ;;
  esac
}

compdef _rdoc rdoc
