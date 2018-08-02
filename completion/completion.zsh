_todo_complete() {
	local word completions
	word="$1"
	completions="$(yoshis-list --cmplt-add "${word}")"
	reply=( "${(ps:\n:)completions}" )
}

compctl -K _todo_complete yoshis-list add

_todo_select_complete() {
        local word completions
        word="$1"
        completions="$(yoshis-list --cmplt-select "${word}")"
        reply=( "${(ps:\n:)completions}" )
}

compctl -K _todo_select_complete yoshis-list 

