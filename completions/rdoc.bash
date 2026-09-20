# bash completion for rdoc
# Install: source completions/rdoc.bash
# Or copy to /etc/bash_completion.d/rdoc

_rdoc_build_opts() {
  COMPREPLY=( $(compgen -W "-o --output -t --title -a --author -l --lang -d --description -w --watch -h --help" -- "$1") )
}

_rdoc() {
  local cur prev words cword
  if declare -F _init_completion >/dev/null 2>&1; then
    _init_completion || return
  else
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
  fi

  local commands="build inspect validate serve open associate init"
  local i cmd=""
  for ((i = 1; i < ${#COMP_WORDS[@]}; i++)); do
    case "${COMP_WORDS[i]}" in
      build|inspect|validate|serve|open|associate|init)
        cmd="${COMP_WORDS[i]}"
        break
        ;;
    esac
  done

  if [[ -z "$cmd" ]]; then
    COMPREPLY=( $(compgen -W "${commands} -h --help -V --version" -- "$cur") )
    return
  fi

  case "$cmd" in
    build)
      case "$prev" in
        -o|--output|-t|--title|-a|--author|-l|--lang|-d|--description)
          if [[ "$prev" == -o || "$prev" == --output ]]; then
            COMPREPLY=( $(compgen -f -- "$cur") )
          else
            COMPREPLY=()
          fi
          return
          ;;
      esac
      if [[ "$cur" == -* ]]; then
        _rdoc_build_opts "$cur"
      else
        COMPREPLY=( $(compgen -f -X '!*.md' -- "$cur") )
        if [[ ${#COMPREPLY[@]} -eq 0 ]]; then
          COMPREPLY=( $(compgen -f -- "$cur") )
        fi
      fi
      ;;
    inspect|validate|open)
      COMPREPLY=( $(compgen -f -- "$cur") )
      ;;
    serve)
      case "$prev" in
        -p|--port)
          COMPREPLY=()
          return
          ;;
      esac
      if [[ "$cur" == -* ]]; then
        COMPREPLY=( $(compgen -W "-p --port -h --help" -- "$cur") )
      else
        COMPREPLY=( $(compgen -f -- "$cur") )
      fi
      ;;
    associate)
      COMPREPLY=( $(compgen -W "--undo -h --help" -- "$cur") )
      ;;
    init)
      case "$prev" in
        -o|--output)
          COMPREPLY=( $(compgen -f -- "$cur") )
          return
          ;;
        init)
          COMPREPLY=( $(compgen -W "demo" -- "$cur") )
          return
          ;;
      esac
      if [[ "$cur" == -* ]]; then
        COMPREPLY=( $(compgen -W "-o --output -h --help" -- "$cur") )
      else
        COMPREPLY=( $(compgen -W "demo" -- "$cur") )
      fi
      ;;
  esac
}

complete -F _rdoc rdoc
