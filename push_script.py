import subprocess

try:
    # This command pushes the changes to the remote repository.
    subprocess.run(['git', 'push'], check=True, capture_output=True, text=True)
    print("Successfully pushed changes to the remote repository.")

except subprocess.CalledProcessError as e:
    print(f"An error occurred while running a git command.")
    print(f"Stderr: {e.stderr}")
    print(f"Stdout: {e.stdout}")
