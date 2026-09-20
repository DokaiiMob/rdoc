# PowerShell completion for rdoc
# Install (current session):
#   . .\completions\rdoc.ps1
# Persist: add the dot-source line to your $PROFILE

function Register-RdocCompleter {
  $commands = @('build', 'inspect', 'validate', 'serve', 'open', 'associate', 'init')

  $buildFlags = @(
    @{ Name = '-o'; Alias = '--output' },
    @{ Name = '-t'; Alias = '--title' },
    @{ Name = '-a'; Alias = '--author' },
    @{ Name = '-l'; Alias = '--lang' },
    @{ Name = '-d'; Alias = '--description' },
    @{ Name = '-w'; Alias = '--watch' }
  )

  $completer = {
    param($wordToComplete, $commandAst, $cursorPosition)

    $elements = @($commandAst.CommandElements | ForEach-Object { $_.ToString() })
    if ($elements.Count -eq 0) { return }

    # Drop the executable name
    $args = @()
    if ($elements.Count -gt 1) {
      $args = $elements[1..($elements.Count - 1)]
    }

    $cmd = $null
    foreach ($a in $args) {
      if ($commands -contains $a) {
        $cmd = $a
        break
      }
    }

    if (-not $cmd) {
      $commands + @('--help', '--version') |
        Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object {
          [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
        }
      return
    }

    switch ($cmd) {
      'build' {
        if ($wordToComplete.StartsWith('-')) {
          foreach ($f in $buildFlags) {
            foreach ($n in @($f.Name, $f.Alias)) {
              if ($n -like "$wordToComplete*") {
                [System.Management.Automation.CompletionResult]::new($n, $n, 'ParameterName', $n)
              }
            }
          }
        }
        else {
          Get-ChildItem -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "$wordToComplete*" } |
            ForEach-Object {
              [System.Management.Automation.CompletionResult]::new($_.Name, $_.Name, 'ProviderItem', $_.Name)
            }
        }
      }
      { $_ -in 'inspect', 'validate', 'open', 'serve' } {
        if ($cmd -eq 'serve' -and $wordToComplete.StartsWith('-')) {
          @('-p', '--port') |
            Where-Object { $_ -like "$wordToComplete*" } |
            ForEach-Object {
              [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
            }
        }
        else {
          Get-ChildItem -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "$wordToComplete*" } |
            ForEach-Object {
              [System.Management.Automation.CompletionResult]::new($_.Name, $_.Name, 'ProviderItem', $_.Name)
            }
        }
      }
      'associate' {
        @('--undo', '--help') |
          Where-Object { $_ -like "$wordToComplete*" } |
          ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
          }
      }
      'init' {
        if ($wordToComplete.StartsWith('-')) {
          @('-o', '--output', '--help') |
            Where-Object { $_ -like "$wordToComplete*" } |
            ForEach-Object {
              [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
            }
        }
        else {
          @('demo') |
            Where-Object { $_ -like "$wordToComplete*" } |
            ForEach-Object {
              [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
            }
        }
      }
    }
  }

  Register-ArgumentCompleter -CommandName rdoc -ScriptBlock $completer
}

Register-RdocCompleter
