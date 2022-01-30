import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFileSync } from "fs";
let release_created = false;
let release_exists = false;
function getPackageVersion() {
    const filePath = core.getInput("path");
    const fileRaw = readFileSync(filePath, { encoding: "utf8" });
    const file = JSON.parse(fileRaw);
    return file.version;
}
async function releaseExists(octokit, tagName) {
    const { repo, owner } = github.context.repo;
    try {
        await octokit.rest.repos.getReleaseByTag({
            owner,
            repo,
            tag: tagName,
        });
        release_exists = true;
        return true;
    }
    catch {
        return false;
    }
}
async function createRelease(octokit, tagName) {
    const { repo, owner } = github.context.repo;
    try {
        await octokit.rest.repos.createRelease({
            owner,
            repo,
            tag_name: tagName,
        });
        core.notice(`New release was made with tag '${tagName}'`);
        release_created = true;
    }
    catch (error) {
        core.setFailed(`Action failed with error ${error}`);
    }
}
async function run() {
    const packageVersion = getPackageVersion();
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const exists = await releaseExists(octokit, packageVersion);
    if (exists) {
        core.notice(`Release with tag '${packageVersion}' already exists`);
    }
    else {
        await createRelease(octokit, packageVersion);
    }
    core.setOutput("release_created", release_created);
    core.setOutput("releaseExists", release_exists);
}
run();
