import { parse } from "node-html-parser";

export type Event = {
    start: Date;
    end: Date;
    main: string;
    resources: string[];
    color: string;
    KW?: string;
};

export async function raplaEventsFor(validURL: string, start: Date): Promise<Event[]> {
    const url = new URL(validURL);
    url.searchParams.set("day", String(start.getDate()).padStart(2, "0"));
    url.searchParams.set("month", String(start.getMonth() + 1).padStart(2, "0"));
    url.searchParams.set("year", String(start.getFullYear()));

    return await fetchRaplaEvents(url.toString());
}

export async function fetchRaplaEvents(URL:string): Promise<Event[]> {
    const response = await fetch(URL);
    const text = await response.text();
    const document = parse(text);

    const selects = document.getElementsByTagName("select");
    const startDay = selects.find((select) =>
        select.getAttribute("name") === "day"
    )
        ?.children.find((option) => option.hasAttribute("selected"))
        ?.textContent;
    const startMonth = selects.find((select) =>
        select.getAttribute("name") === "month"
    )?.children.find((option) => option.hasAttribute("selected"))?.getAttribute(
        "value",
    );
    const startYear = selects.find((select) =>
        select.getAttribute("name") === "year"
    )?.children.find((option) => option.hasAttribute("selected"))?.textContent;

    const documentStartDate = new Date(
        Number(startYear),
        Number(startMonth) - 1,
        Number(startDay),
    );

    const events: Event[] = [];

    for (const weekTable of document.querySelectorAll(".week_table")) {
        const firstRow = weekTable.querySelector("tr")!;
        let items = firstRow.children.map((item) => item.textContent.trim())
            .filter(
                (text) => text.length > 0,
            );
        const KW = items.shift()!;
        const dates = items.map((item) => {
            const numberPart = /(\d{2}\.\d{2})/g;

            const [day, month] = item.match(numberPart)![0].split(".").map(
                Number,
            );

            // Check if the date is in the next year using day and month
            let year = documentStartDate.getFullYear();
            if (
                month! < documentStartDate.getMonth() + 1 ||
                (month === documentStartDate.getMonth() + 1 &&
                    day! < documentStartDate.getDate())
            ) {
                year += 1;
            }

            return new Date(year, month! - 1, day);
        });

        for (const row of weekTable.querySelectorAll("tr").slice(1)) {
            const cols = row.children;

            let dayIndex = 0;
            for (const element of cols) {
                const type = element.getAttribute("class");

                let date = dates[dayIndex]!;

                if (type === "week_block") {
                    const linkContent = element.querySelector("a")?.textContent;

                    const [timeOfDay, main] = linkContent?.split("\n")!;

                    const resources = element.querySelectorAll(".resource").map(
                        (
                            resource,
                        ) => resource.textContent.trim()
                    );

                    const color =
                        element.attributes.style?.match(
                            /background-color:\s*([^;]+)/,
                        )
                            ?.[1] ||
                        "transparent";

                    const [startTimeStr, endTimeStr] = timeOfDay!.split("-")
                        .map((str) => str.trim());
                    const [startHour, startMinute] = startTimeStr!.split(":")
                        .map(Number);
                    const [endHour, endMinute] = endTimeStr!.split(":").map(
                        Number,
                    );

                    let startTime = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        startHour,
                        startMinute,
                    );
                    let endTime = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        endHour,
                        endMinute,
                    );

                    let ev = {
                        start: startTime!,
                        end: endTime!,
                        main: main!,
                        resources,
                        color,
                        KW,
                    };

                    events.push(ev);
                }
                if (type === "week_separatorcell") {
                    dayIndex++;
                }
            }
        }
    }

    return events;
}
