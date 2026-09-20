# fish completion for rdoc
# Install: copy to ~/.config/fish/completions/rdoc.fish

complete -c rdoc -f

complete -c rdoc -n __fish_use_subcommand -a build -d 'Compile Markdown to .rdoc / .rdoc.html'
complete -c rdoc -n __fish_use_subcommand -a inspect -d 'Show manifest, size, hash, reading time'
complete -c rdoc -n __fish_use_subcommand -a validate -d 'Validate document (CI-friendly exit codes)'
complete -c rdoc -n __fish_use_subcommand -a serve -d 'Local HTTP preview'
complete -c rdoc -n __fish_use_subcommand -a open -d 'Open in browser'
complete -c rdoc -n __fish_use_subcommand -a associate -d 'Register or remove OS file association'
complete -c rdoc -n __fish_use_subcommand -a init -d 'Write demo fixture'

complete -c rdoc -n __fish_use_subcommand -s h -l help -d 'Show help'
complete -c rdoc -n __fish_use_subcommand -s V -l version -d 'Show version'

# build
complete -c rdoc -n '__fish_seen_subcommand_from build' -s o -l output -r -d 'Output file'
complete -c rdoc -n '__fish_seen_subcommand_from build' -s t -l title -r -d 'Document title'
complete -c rdoc -n '__fish_seen_subcommand_from build' -s a -l author -r -d 'Author'
complete -c rdoc -n '__fish_seen_subcommand_from build' -s l -l lang -r -d 'Language (BCP 47)'
complete -c rdoc -n '__fish_seen_subcommand_from build' -s d -l description -r -d 'Short description'
complete -c rdoc -n '__fish_seen_subcommand_from build' -s w -l watch -d 'Watch and rebuild'
complete -c rdoc -n '__fish_seen_subcommand_from build' -k -a '(__fish_complete_suffix .md)'

# inspect / validate / open
complete -c rdoc -n '__fish_seen_subcommand_from inspect validate open' -k -a '(__fish_complete_path)'

# serve
complete -c rdoc -n '__fish_seen_subcommand_from serve' -s p -l port -r -d 'Port'
complete -c rdoc -n '__fish_seen_subcommand_from serve' -k -a '(__fish_complete_path)'

# associate
complete -c rdoc -n '__fish_seen_subcommand_from associate' -l undo -d 'Remove association'

# init
complete -c rdoc -n '__fish_seen_subcommand_from init' -a demo -d 'Write sample.md fixture'
complete -c rdoc -n '__fish_seen_subcommand_from init' -s o -l output -r -d 'Output path'
