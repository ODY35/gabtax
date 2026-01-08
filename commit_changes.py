import subprocess

try:
    # This command stages all new and modified files.
    subprocess.run(['git', 'add', '.'], check=True, capture_output=True, text=True)
    print("Successfully staged all changes.")

    # This command commits the staged changes with a message.
    commit_message = "fix: Restore dashboard UI"
    subprocess.run(['git', 'commit', '-m', commit_message], check=True, capture_output=True, text=True)
    print(f"Successfully committed changes with message: '{commit_message}'")

    # This command pushes the changes to the remote repository.
    subprocess.run(['git', 'push'], check=True, capture_output=True, text=True)
    print("Successfully pushed changes to the remote repository.")

except subprocess.CalledProcessError as e:
    print(f"An error occurred while running a git command.")
    print(f"Stderr: {e.stderr}")
    print(f"Stdout: {e.stdout}")
